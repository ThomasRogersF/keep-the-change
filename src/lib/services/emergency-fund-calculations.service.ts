export function calculateEmergencyTarget(monthlyExpenses: number, targetMonths: number): number {
  return monthlyExpenses * targetMonths;
}

export function calculateEmergencyProgress(currentBalance: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0;
  return Math.min((currentBalance / targetAmount) * 100, 100);
}

export function calculateMonthsCovered(currentBalance: number, monthlyExpenses: number): number {
  if (monthlyExpenses <= 0) return 0;
  return currentBalance / monthlyExpenses;
}

/** Given a shortfall and a number of months to close it, the required monthly contribution. */
export function calculateReplenishmentContribution(shortfall: number, monthsToReplenish: number): number {
  if (monthsToReplenish <= 0) return shortfall;
  return shortfall / monthsToReplenish;
}

/** Given a shortfall and a desired monthly contribution, the estimated months to close it. */
export function calculateReplenishmentMonths(shortfall: number, monthlyContribution: number): number {
  if (monthlyContribution <= 0) return Infinity;
  return shortfall / monthlyContribution;
}
