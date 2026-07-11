import type { AssetHolding, InvestmentActivity } from "@/lib/types";

export function calculateHoldingCostBasis(holding: Pick<AssetHolding, "costBasisTotal">): number {
  return holding.costBasisTotal;
}

export function calculateHoldingValue(
  holding: Pick<AssetHolding, "quantity" | "currentPricePerUnit">
): number {
  return holding.quantity * holding.currentPricePerUnit;
}

export interface UnrealizedGain {
  amount: number;
  percent: number;
}

export function calculateUnrealizedGain(
  holding: Pick<AssetHolding, "quantity" | "currentPricePerUnit" | "costBasisTotal">
): UnrealizedGain {
  const costBasis = calculateHoldingCostBasis(holding);
  const value = calculateHoldingValue(holding);
  const amount = value - costBasis;
  const percent = costBasis > 0 ? (amount / costBasis) * 100 : 0;
  return { amount, percent };
}

/** Realized gain for a single sale, given the holding's average cost per unit before the sale. */
export function calculateRealizedGain(
  quantitySold: number,
  sellPricePerUnit: number,
  avgCostBasisPerUnit: number
): number {
  return quantitySold * (sellPricePerUnit - avgCostBasisPerUnit);
}

/**
 * Replays a holding's full buy/sell history (average-cost method) to derive lifetime
 * realized gain. Optionally restricts the summed total to sells on/after `since`
 * (YYYY-MM-DD) while still replaying earlier buys so the running average cost stays correct.
 */
export function calculateHoldingRealizedGainTotal(
  activities: InvestmentActivity[],
  since?: string
): number {
  // Sort by date, then createdAt as a tiebreaker — same-day buy/sell activities have
  // an identical `date` string, and processing a sell before its matching buy would
  // silently zero out the realized gain (nothing held yet to compute cost basis from).
  const sorted = [...activities]
    .filter((a) => a.type === "buy" || a.type === "sell")
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.getTime() - b.createdAt.getTime());

  let quantity = 0;
  let costBasis = 0;
  let realized = 0;

  for (const activity of sorted) {
    if (activity.type === "buy" && activity.quantity && activity.pricePerUnit) {
      quantity += activity.quantity;
      costBasis += activity.quantity * activity.pricePerUnit;
    } else if (activity.type === "sell" && activity.quantity && activity.pricePerUnit) {
      const avgCostPerUnit = quantity > 0 ? costBasis / quantity : 0;
      const sellQuantity = Math.min(activity.quantity, quantity);
      const gain = calculateRealizedGain(sellQuantity, activity.pricePerUnit, avgCostPerUnit);
      if (!since || activity.date >= since) {
        realized += gain;
      }
      costBasis = Math.max(0, costBasis - avgCostPerUnit * sellQuantity);
      quantity = Math.max(0, quantity - sellQuantity);
    }
  }

  return realized;
}

export interface AllocationSlice {
  symbol: string;
  value: number;
  percent: number;
}

export function calculatePortfolioAllocation(
  holdings: Array<Pick<AssetHolding, "symbol" | "quantity" | "currentPricePerUnit">>
): AllocationSlice[] {
  const active = holdings.filter((h) => h.quantity > 0);
  const total = active.reduce((sum, h) => sum + calculateHoldingValue(h), 0);
  return active
    .map((h) => {
      const value = calculateHoldingValue(h);
      return { symbol: h.symbol, value, percent: total > 0 ? (value / total) * 100 : 0 };
    })
    .sort((a, b) => b.value - a.value);
}
