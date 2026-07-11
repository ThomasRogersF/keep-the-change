import { db } from "@/lib/db/database";
import { yieldProfileRepository } from "@/lib/db/repositories/yield-profile.repository";
import { yieldRateHistoryRepository } from "@/lib/db/repositories/yield-rate-history.repository";
import { wealthAccountRepository } from "@/lib/db/repositories/wealth-account.repository";
import type { WealthAccount, YieldProfile, YieldRateHistory } from "@/lib/types";
import { calculateEstimatedApyReturn, calculateEstimatedAprReturn } from "./yield-calculations.service";

export interface YieldSummary {
  profile: YieldProfile;
  wealthAccount: WealthAccount | undefined;
  estimatedAnnual: number;
  estimatedMonthly: number;
  rateHistory: YieldRateHistory[];
}

export async function getYieldSummary(wealthAccountId: string): Promise<YieldSummary | undefined> {
  const profile = await yieldProfileRepository.getByWealthAccountId(wealthAccountId);
  if (!profile) return undefined;
  const wealthAccount = await wealthAccountRepository.getById(wealthAccountId);
  const balance = wealthAccount?.balance ?? 0;
  const estimatedAnnual =
    profile.rateType === "APY"
      ? calculateEstimatedApyReturn(balance, profile.currentRate, "annual")
      : calculateEstimatedAprReturn(balance, profile.currentRate, "annual");
  const estimatedMonthly =
    profile.rateType === "APY"
      ? calculateEstimatedApyReturn(balance, profile.currentRate, "monthly")
      : estimatedAnnual / 12;
  const rateHistory = await yieldRateHistoryRepository.getByProfileId(profile.id);

  return { profile, wealthAccount, estimatedAnnual, estimatedMonthly, rateHistory };
}

export interface CreateYieldProfileInput {
  wealthAccountId: string;
  rateType: "APY" | "APR";
  currentRate: number;
  effectiveDate: string;
}

export async function createYieldProfile(input: CreateYieldProfileInput): Promise<string> {
  return db.transaction("rw", [db.yieldProfiles, db.yieldRateHistories], async () => {
    const profileId = await yieldProfileRepository.create({
      wealthAccountId: input.wealthAccountId,
      rateType: input.rateType,
      currentRate: input.currentRate,
    });
    await yieldRateHistoryRepository.create({
      yieldProfileId: profileId,
      rate: input.currentRate,
      effectiveDate: input.effectiveDate,
    });
    return profileId;
  });
}

export interface UpdateRateInput {
  profileId: string;
  newRate: number;
  effectiveDate: string;
  note?: string;
}

export async function updateRate(input: UpdateRateInput): Promise<void> {
  await db.transaction("rw", [db.yieldProfiles, db.yieldRateHistories], async () => {
    await yieldProfileRepository.update(input.profileId, { currentRate: input.newRate });
    await yieldRateHistoryRepository.create({
      yieldProfileId: input.profileId,
      rate: input.newRate,
      effectiveDate: input.effectiveDate,
      note: input.note,
    });
  });
}

export async function deleteYieldProfileCascade(profileId: string): Promise<void> {
  await yieldRateHistoryRepository.deleteByProfileId(profileId);
  await yieldProfileRepository.delete(profileId);
}
