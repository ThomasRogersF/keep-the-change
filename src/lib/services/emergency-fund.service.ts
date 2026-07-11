import { format } from "date-fns";
import { db } from "@/lib/db/database";
import { emergencyFundRepository } from "@/lib/db/repositories/emergency-fund.repository";
import { emergencyFundActivityRepository } from "@/lib/db/repositories/emergency-fund-activity.repository";
import { wealthAccountRepository } from "@/lib/db/repositories/wealth-account.repository";
import { yieldProfileRepository } from "@/lib/db/repositories/yield-profile.repository";
import type { EmergencyFund, EmergencyWithdrawalReason, WealthAccount, YieldProfile } from "@/lib/types";
import {
  calculateEmergencyTarget,
  calculateEmergencyProgress,
  calculateMonthsCovered,
} from "./emergency-fund-calculations.service";

export interface EmergencyFundSummary {
  fund: EmergencyFund;
  wealthAccount: WealthAccount | undefined;
  yieldProfile: YieldProfile | undefined;
  currentBalance: number;
  targetAmount: number;
  progressPercent: number;
  monthsCovered: number;
  amountRemaining: number;
  monthlyContributionAverage: number;
  lastContributionDate: string | null;
  totalContributions: number;
  totalWithdrawals: number;
}

function monthsSince(startDate: string, now: Date): number {
  const [sy, sm] = startDate.split("-").map(Number);
  const months = (now.getFullYear() - sy) * 12 + (now.getMonth() + 1 - sm) + 1;
  return Math.max(1, months);
}

export async function getEmergencyFundSummary(fundId: string): Promise<EmergencyFundSummary | undefined> {
  const fund = await emergencyFundRepository.getById(fundId);
  if (!fund) return undefined;

  const wealthAccount = await wealthAccountRepository.getById(fund.wealthAccountId);
  const yieldProfile = await yieldProfileRepository.getByWealthAccountId(fund.wealthAccountId);
  const activities = await emergencyFundActivityRepository.getByFundId(fundId);

  const currentBalance = wealthAccount?.balance ?? 0;
  const targetAmount = calculateEmergencyTarget(fund.monthlyExpenses, fund.targetMonths);
  const progressPercent = calculateEmergencyProgress(currentBalance, targetAmount);
  const monthsCovered = calculateMonthsCovered(currentBalance, fund.monthlyExpenses);
  const amountRemaining = Math.max(0, targetAmount - currentBalance);

  const contributions = activities.filter((a) => a.type === "contribution");
  const totalContributions = contributions.reduce((s, a) => s + a.amount, 0);
  const totalWithdrawals = activities
    .filter((a) => a.type === "withdrawal")
    .reduce((s, a) => s + a.amount, 0);
  const lastContributionDate = contributions[0]?.date ?? null; // already sorted desc by date
  const firstContribution = contributions[contributions.length - 1];
  const monthlyContributionAverage = firstContribution
    ? totalContributions / monthsSince(firstContribution.date, new Date())
    : 0;

  return {
    fund,
    wealthAccount,
    yieldProfile,
    currentBalance,
    targetAmount,
    progressPercent,
    monthsCovered,
    amountRemaining,
    monthlyContributionAverage,
    lastContributionDate,
    totalContributions,
    totalWithdrawals,
  };
}

export async function getAllEmergencyFundsSummary(): Promise<EmergencyFundSummary[]> {
  const funds = await emergencyFundRepository.getAll();
  const summaries = await Promise.all(funds.map((f) => getEmergencyFundSummary(f.id)));
  return summaries.filter((s): s is EmergencyFundSummary => !!s);
}

export interface ContributionInput {
  emergencyFundId: string;
  amount: number;
  date: string;
  note?: string;
}

export async function createContribution(input: ContributionInput): Promise<void> {
  const fund = await emergencyFundRepository.getById(input.emergencyFundId);
  if (!fund) throw new Error("Emergency fund not found");

  await db.transaction("rw", [db.wealthAccounts, db.emergencyFundActivities], async () => {
    await wealthAccountRepository.adjustBalance(fund.wealthAccountId, input.amount);
    await emergencyFundActivityRepository.create({
      emergencyFundId: input.emergencyFundId,
      type: "contribution",
      amount: input.amount,
      date: input.date,
      note: input.note,
    });
  });
}

export interface WithdrawalInput {
  emergencyFundId: string;
  amount: number;
  date: string;
  reason: EmergencyWithdrawalReason;
  note?: string;
}

export interface WithdrawalResult {
  requiresConfirmation: boolean;
}

export async function createWithdrawal(
  input: WithdrawalInput,
  options: { confirmed?: boolean } = {}
): Promise<WithdrawalResult> {
  const fund = await emergencyFundRepository.getById(input.emergencyFundId);
  if (!fund) throw new Error("Emergency fund not found");
  const account = await wealthAccountRepository.getById(fund.wealthAccountId);
  if (!account) throw new Error("Linked account not found");

  if (input.amount > account.balance && !options.confirmed) {
    return { requiresConfirmation: true };
  }

  await db.transaction("rw", [db.wealthAccounts, db.emergencyFundActivities], async () => {
    await wealthAccountRepository.adjustBalance(fund.wealthAccountId, -input.amount);
    await emergencyFundActivityRepository.create({
      emergencyFundId: input.emergencyFundId,
      type: "withdrawal",
      amount: input.amount,
      date: input.date,
      reason: input.reason,
      note: input.note,
    });
  });

  return { requiresConfirmation: false };
}

export async function deleteEmergencyFundActivity(activityId: string): Promise<void> {
  await db.transaction("rw", [db.wealthAccounts, db.emergencyFundActivities], async () => {
    const activity = await emergencyFundActivityRepository.getById(activityId);
    if (!activity) return;
    const fund = await emergencyFundRepository.getById(activity.emergencyFundId);
    if (fund) {
      const delta = activity.type === "contribution" ? -activity.amount : activity.amount;
      await wealthAccountRepository.adjustBalance(fund.wealthAccountId, delta);
    }
    await emergencyFundActivityRepository.delete(activityId);
  });
}

export async function deleteEmergencyFundCascade(fundId: string): Promise<void> {
  await emergencyFundActivityRepository.deleteByFundId(fundId);
  await emergencyFundRepository.delete(fundId);
}

export interface CreateEmergencyFundWithAccountInput {
  name: string;
  monthlyExpenses: number;
  targetMonths: number;
  openingBalance: number;
  institution?: string;
  currency: string;
}

/** Bundles a new linked WealthAccount with the fund — the account is the single
 * source of truth for the fund's balance (see plan decisions D1/D2). A nonzero opening
 * balance is also logged as a contribution activity so it counts toward Total
 * Contributions instead of silently showing up as unexplained "growth". */
export async function createEmergencyFundWithAccount(
  input: CreateEmergencyFundWithAccountInput
): Promise<string> {
  return db.transaction(
    "rw",
    [db.wealthAccounts, db.emergencyFunds, db.emergencyFundActivities],
    async () => {
      const wealthAccountId = await wealthAccountRepository.create({
        name: input.name,
        type: "cash",
        assetClass: "fiat",
        balance: input.openingBalance,
        currency: input.currency,
        institution: input.institution,
        riskLevel: "low",
        liquidity: "immediate",
        insuranceType: "FDIC",
        archived: false,
      });
      const fundId = await emergencyFundRepository.create({
        name: input.name,
        wealthAccountId,
        monthlyExpenses: input.monthlyExpenses,
        targetMonths: input.targetMonths,
      });
      if (input.openingBalance > 0) {
        await emergencyFundActivityRepository.create({
          emergencyFundId: fundId,
          type: "contribution",
          amount: input.openingBalance,
          date: format(new Date(), "yyyy-MM-dd"),
          note: "Opening balance",
        });
      }
      return fundId;
    }
  );
}

export interface UpdateEmergencyFundInput {
  name: string;
  monthlyExpenses: number;
  targetMonths: number;
}

export async function updateEmergencyFund(
  fundId: string,
  input: UpdateEmergencyFundInput
): Promise<void> {
  await emergencyFundRepository.update(fundId, input);
}
