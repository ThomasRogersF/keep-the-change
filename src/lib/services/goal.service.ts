import { db } from "@/lib/db/database";
import { goalAllocationRepository } from "@/lib/db/repositories/goal-allocation.repository";
import { goalSpendLinkRepository } from "@/lib/db/repositories/goal-spend-link.repository";

export async function getGoalSaved(goalId: string): Promise<number> {
  const allocSum = await goalAllocationRepository.getSumByGoalId(goalId);
  const spendSum = await goalSpendLinkRepository.getSumByGoalId(goalId);
  return allocSum - spendSum;
}

export interface GoalProgress {
  allocated: number;
  spent: number;
  saved: number;
  remaining: number;
  percent: number;
  isOverfunded: boolean;
}

export async function getGoalProgress(goalId: string): Promise<GoalProgress> {
  const goal = await db.goals.get(goalId);
  if (!goal) {
    return { allocated: 0, spent: 0, saved: 0, remaining: 0, percent: 0, isOverfunded: false };
  }

  const allocated = await goalAllocationRepository.getSumByGoalId(goalId);
  const spent = await goalSpendLinkRepository.getSumByGoalId(goalId);
  const saved = allocated - spent;
  const remaining = goal.targetAmount - saved;
  const percent = goal.targetAmount > 0 ? Math.min((saved / goal.targetAmount) * 100, 100) : 0;
  const isOverfunded = saved > goal.targetAmount;

  return { allocated, spent, saved, remaining, percent, isOverfunded };
}

export interface GoalsSummary {
  totalSaved: number;
  totalRemaining: number;
  totalTarget: number;
  activeCount: number;
}

export async function getGoalsSummary(): Promise<GoalsSummary> {
  const goals = await db.goals.filter((g) => !g.archived).toArray();
  let totalSaved = 0;
  let totalTarget = 0;

  for (const goal of goals) {
    const allocSum = await goalAllocationRepository.getSumByGoalId(goal.id);
    const spendSum = await goalSpendLinkRepository.getSumByGoalId(goal.id);
    totalSaved += allocSum - spendSum;
    totalTarget += goal.targetAmount;
  }

  return {
    totalSaved,
    totalRemaining: totalTarget - totalSaved,
    totalTarget,
    activeCount: goals.length,
  };
}

export async function deleteGoalCascade(goalId: string): Promise<void> {
  await goalAllocationRepository.deleteByGoalId(goalId);
  await goalSpendLinkRepository.deleteByGoalId(goalId);
  await db.goals.delete(goalId);
}
