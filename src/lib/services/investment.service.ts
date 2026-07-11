import { db } from "@/lib/db/database";
import { wealthAccountRepository } from "@/lib/db/repositories/wealth-account.repository";
import { assetHoldingRepository } from "@/lib/db/repositories/asset-holding.repository";
import { investmentActivityRepository } from "@/lib/db/repositories/investment-activity.repository";
import type { AssetHolding } from "@/lib/types";
import {
  calculateHoldingValue,
  calculateUnrealizedGain,
  calculateRealizedGain,
  calculateHoldingRealizedGainTotal,
  calculatePortfolioAllocation,
} from "./investment-calculations.service";

export interface HoldingSummary {
  holding: AssetHolding;
  costBasis: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  realizedGain: number;
  isActive: boolean;
}

export async function getHoldingSummary(holdingId: string): Promise<HoldingSummary | undefined> {
  const holding = await assetHoldingRepository.getById(holdingId);
  if (!holding) return undefined;
  const activities = await investmentActivityRepository.getByHoldingId(holdingId);
  const { amount: unrealizedGain, percent: unrealizedGainPercent } = calculateUnrealizedGain(holding);
  return {
    holding,
    costBasis: holding.costBasisTotal,
    currentValue: calculateHoldingValue(holding),
    unrealizedGain,
    unrealizedGainPercent,
    realizedGain: calculateHoldingRealizedGainTotal(activities),
    isActive: holding.quantity > 0,
  };
}

export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  realizedGain: number;
  dividendsReceived: number;
  feesTotal: number;
  allocation: ReturnType<typeof calculatePortfolioAllocation>;
  holdingsCount: number;
}

export async function getPortfolioSummary(wealthAccountId?: string): Promise<PortfolioSummary> {
  const holdings = wealthAccountId
    ? await assetHoldingRepository.getByWealthAccountId(wealthAccountId)
    : await assetHoldingRepository.getAll();
  const activeHoldings = holdings.filter((h) => h.quantity > 0);
  const totalValue = activeHoldings.reduce((s, h) => s + calculateHoldingValue(h), 0);
  const totalCostBasis = activeHoldings.reduce((s, h) => s + h.costBasisTotal, 0);
  const unrealizedGain = totalValue - totalCostBasis;

  let realizedGain = 0;
  for (const holding of holdings) {
    const activities = await investmentActivityRepository.getByHoldingId(holding.id);
    realizedGain += calculateHoldingRealizedGainTotal(activities);
  }

  const accountIds = wealthAccountId
    ? [wealthAccountId]
    : (await wealthAccountRepository.getByType("brokerage")).map((a) => a.id);
  let dividendsReceived = 0;
  let feesTotal = 0;
  for (const id of accountIds) {
    const activities = await investmentActivityRepository.getByAccountId(id);
    dividendsReceived += activities
      .filter((a) => a.type === "dividend")
      .reduce((s, a) => s + (a.amount ?? 0), 0);
    feesTotal += activities.filter((a) => a.type === "fee").reduce((s, a) => s + (a.amount ?? 0), 0);
  }

  return {
    totalValue,
    totalCostBasis,
    unrealizedGain,
    unrealizedGainPercent: totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0,
    realizedGain,
    dividendsReceived,
    feesTotal,
    allocation: calculatePortfolioAllocation(activeHoldings),
    holdingsCount: activeHoldings.length,
  };
}

export interface BuyInput {
  wealthAccountId: string;
  assetHoldingId: string;
  quantity: number;
  pricePerUnit: number;
  date: string;
  note?: string;
}

export async function executeBuy(input: BuyInput): Promise<void> {
  const cost = input.quantity * input.pricePerUnit;
  await db.transaction(
    "rw",
    [db.wealthAccounts, db.assetHoldings, db.investmentActivities],
    async () => {
      const account = await wealthAccountRepository.getById(input.wealthAccountId);
      const holding = await assetHoldingRepository.getById(input.assetHoldingId);
      if (!account || !holding) throw new Error("Account or holding not found");
      if (account.balance < cost) throw new Error("Insufficient brokerage cash for this purchase");

      await wealthAccountRepository.update(input.wealthAccountId, { balance: account.balance - cost });
      await assetHoldingRepository.update(input.assetHoldingId, {
        quantity: holding.quantity + input.quantity,
        costBasisTotal: holding.costBasisTotal + cost,
        currentPricePerUnit: input.pricePerUnit,
        priceUpdatedAt: new Date(),
      });
      await investmentActivityRepository.create({
        wealthAccountId: input.wealthAccountId,
        assetHoldingId: input.assetHoldingId,
        type: "buy",
        date: input.date,
        quantity: input.quantity,
        pricePerUnit: input.pricePerUnit,
        note: input.note,
      });
    }
  );
}

export interface SellInput {
  wealthAccountId: string;
  assetHoldingId: string;
  quantity: number;
  pricePerUnit: number;
  date: string;
  note?: string;
}

export interface SellResult {
  realizedGain: number;
  proceeds: number;
}

export async function executeSell(input: SellInput): Promise<SellResult> {
  return db.transaction(
    "rw",
    [db.wealthAccounts, db.assetHoldings, db.investmentActivities],
    async () => {
      const account = await wealthAccountRepository.getById(input.wealthAccountId);
      const holding = await assetHoldingRepository.getById(input.assetHoldingId);
      if (!account || !holding) throw new Error("Account or holding not found");
      if (input.quantity > holding.quantity) throw new Error("Cannot sell more than you hold");

      const avgCostPerUnit = holding.quantity > 0 ? holding.costBasisTotal / holding.quantity : 0;
      const proceeds = input.quantity * input.pricePerUnit;
      const realizedGain = calculateRealizedGain(input.quantity, input.pricePerUnit, avgCostPerUnit);
      const costBasisRemoved = avgCostPerUnit * input.quantity;

      await wealthAccountRepository.update(input.wealthAccountId, {
        balance: account.balance + proceeds,
      });
      await assetHoldingRepository.update(input.assetHoldingId, {
        quantity: holding.quantity - input.quantity,
        costBasisTotal: Math.max(0, holding.costBasisTotal - costBasisRemoved),
        currentPricePerUnit: input.pricePerUnit,
        priceUpdatedAt: new Date(),
      });
      await investmentActivityRepository.create({
        wealthAccountId: input.wealthAccountId,
        assetHoldingId: input.assetHoldingId,
        type: "sell",
        date: input.date,
        quantity: input.quantity,
        pricePerUnit: input.pricePerUnit,
        note: input.note,
      });

      return { realizedGain, proceeds };
    }
  );
}

export interface CashActivityInput {
  wealthAccountId: string;
  assetHoldingId?: string;
  amount: number;
  date: string;
  note?: string;
}

export async function recordDividend(input: CashActivityInput): Promise<void> {
  await db.transaction("rw", [db.wealthAccounts, db.investmentActivities], async () => {
    const account = await wealthAccountRepository.getById(input.wealthAccountId);
    if (!account) throw new Error("Account not found");
    await wealthAccountRepository.update(input.wealthAccountId, {
      balance: account.balance + input.amount,
    });
    await investmentActivityRepository.create({
      wealthAccountId: input.wealthAccountId,
      assetHoldingId: input.assetHoldingId,
      type: "dividend",
      date: input.date,
      amount: input.amount,
      note: input.note,
    });
  });
}

export async function recordFee(input: CashActivityInput): Promise<void> {
  await db.transaction("rw", [db.wealthAccounts, db.investmentActivities], async () => {
    const account = await wealthAccountRepository.getById(input.wealthAccountId);
    if (!account) throw new Error("Account not found");
    await wealthAccountRepository.update(input.wealthAccountId, {
      balance: account.balance - input.amount,
    });
    await investmentActivityRepository.create({
      wealthAccountId: input.wealthAccountId,
      assetHoldingId: input.assetHoldingId,
      type: "fee",
      date: input.date,
      amount: input.amount,
      note: input.note,
    });
  });
}

export interface PriceUpdateInput {
  wealthAccountId: string;
  assetHoldingId: string;
  pricePerUnit: number;
  date: string;
}

export async function recordManualPriceUpdate(input: PriceUpdateInput): Promise<void> {
  await db.transaction("rw", [db.assetHoldings, db.investmentActivities], async () => {
    const holding = await assetHoldingRepository.getById(input.assetHoldingId);
    if (!holding) throw new Error("Holding not found");
    await assetHoldingRepository.update(input.assetHoldingId, {
      currentPricePerUnit: input.pricePerUnit,
      priceUpdatedAt: new Date(),
    });
    await investmentActivityRepository.create({
      wealthAccountId: input.wealthAccountId,
      assetHoldingId: input.assetHoldingId,
      type: "priceUpdate",
      date: input.date,
      pricePerUnit: input.pricePerUnit,
    });
  });
}

/** Type-aware reversal + soft delete. See known limitation: reversing a "sell" uses the
 * holding's current average cost as an approximation rather than a full historical replay. */
export async function deleteInvestmentActivity(activityId: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.wealthAccounts, db.assetHoldings, db.investmentActivities],
    async () => {
      const activity = await investmentActivityRepository.getById(activityId);
      if (!activity) return;
      const account = await wealthAccountRepository.getById(activity.wealthAccountId);
      const holding = activity.assetHoldingId
        ? await assetHoldingRepository.getById(activity.assetHoldingId)
        : undefined;

      if (activity.type === "buy" && account && holding && activity.quantity && activity.pricePerUnit) {
        const cost = activity.quantity * activity.pricePerUnit;
        await wealthAccountRepository.update(account.id, { balance: account.balance + cost });
        await assetHoldingRepository.update(holding.id, {
          quantity: Math.max(0, holding.quantity - activity.quantity),
          costBasisTotal: Math.max(0, holding.costBasisTotal - cost),
        });
      } else if (
        activity.type === "sell" &&
        account &&
        holding &&
        activity.quantity &&
        activity.pricePerUnit
      ) {
        const proceeds = activity.quantity * activity.pricePerUnit;
        const avgCostPerUnit =
          holding.quantity > 0 ? holding.costBasisTotal / holding.quantity : activity.pricePerUnit;
        await wealthAccountRepository.update(account.id, { balance: account.balance - proceeds });
        await assetHoldingRepository.update(holding.id, {
          quantity: holding.quantity + activity.quantity,
          costBasisTotal: holding.costBasisTotal + avgCostPerUnit * activity.quantity,
        });
      } else if (activity.type === "dividend" && account && activity.amount) {
        await wealthAccountRepository.update(account.id, { balance: account.balance - activity.amount });
      } else if (activity.type === "fee" && account && activity.amount) {
        await wealthAccountRepository.update(account.id, { balance: account.balance + activity.amount });
      } else if (activity.type === "priceUpdate" && holding) {
        const remaining = (await investmentActivityRepository.getByHoldingId(holding.id))
          .filter((a) => a.id !== activityId && a.pricePerUnit !== undefined)
          .sort(
            (a, b) => b.date.localeCompare(a.date) || b.createdAt.getTime() - a.createdAt.getTime()
          );
        const previous = remaining[0];
        await assetHoldingRepository.update(holding.id, {
          currentPricePerUnit: previous?.pricePerUnit ?? holding.currentPricePerUnit,
          priceUpdatedAt: previous ? new Date() : null,
        });
      }

      await investmentActivityRepository.delete(activityId);
    }
  );
}

/** Removes the holding shell and its activity log. Does NOT reverse historical cash
 * effects already applied to the brokerage balance (each buy/sell already moved cash
 * at the time it happened) — mirrors how deleting a Goal doesn't touch its account. */
export async function deleteAssetHoldingCascade(holdingId: string): Promise<void> {
  await investmentActivityRepository.deleteByHoldingId(holdingId);
  await assetHoldingRepository.delete(holdingId);
}
