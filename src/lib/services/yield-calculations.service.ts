export type YieldPeriod = "annual" | "monthly";

/**
 * APY compounds; the monthly figure is derived from the annual rate rather than
 * being a simple /12 division, per the spec's compounding formula.
 */
export function calculateEstimatedApyReturn(
  balance: number,
  apyPercent: number,
  period: YieldPeriod
): number {
  if (period === "annual") {
    return balance * (apyPercent / 100);
  }
  return balance * (Math.pow(1 + apyPercent / 100, 1 / 12) - 1);
}

export type AprPeriod = "annual" | { days: number };

export function calculateEstimatedAprReturn(
  principal: number,
  aprPercent: number,
  period: AprPeriod
): number {
  if (period === "annual") {
    return principal * (aprPercent / 100);
  }
  return principal * (aprPercent / 100) * (period.days / 365);
}
