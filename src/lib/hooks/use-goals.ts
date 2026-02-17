"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";
import { goalAllocationRepository } from "@/lib/db/repositories/goal-allocation.repository";
import { goalSpendLinkRepository } from "@/lib/db/repositories/goal-spend-link.repository";
import type { Goal, GoalAllocation, GoalSpendLink } from "@/lib/types";

export function useGoals(): Goal[] {
  return useLiveQuery(
    () => db.goals.filter((g) => !g.archived && !g.deletedAt).toArray(),
    [],
    []
  );
}

export function useArchivedGoals(): Goal[] {
  return useLiveQuery(
    () => db.goals.filter((g) => g.archived && !g.deletedAt).toArray(),
    [],
    []
  );
}

export function useGoal(id: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!id) return undefined;
      const goal = await db.goals.get(id);
      if (goal && goal.deletedAt) return undefined;
      return goal;
    },
    [id],
    undefined
  );
}

export function useGoalAllocations(goalId: string | undefined): GoalAllocation[] {
  return useLiveQuery(
    () =>
      goalId
        ? goalAllocationRepository.getByGoalId(goalId)
        : Promise.resolve([]),
    [goalId],
    []
  );
}

export function useGoalSpendLinks(goalId: string | undefined): GoalSpendLink[] {
  return useLiveQuery(
    () =>
      goalId
        ? goalSpendLinkRepository.getByGoalId(goalId)
        : Promise.resolve([]),
    [goalId],
    []
  );
}

interface GoalProgressData {
  allocated: number;
  spent: number;
  saved: number;
  remaining: number;
  percent: number;
  isOverfunded: boolean;
}

const defaultProgress: GoalProgressData = {
  allocated: 0,
  spent: 0,
  saved: 0,
  remaining: 0,
  percent: 0,
  isOverfunded: false,
};

export function useGoalProgress(goalId: string | undefined): GoalProgressData {
  return useLiveQuery(
    async (): Promise<GoalProgressData> => {
      if (!goalId) return defaultProgress;
      const goal = await db.goals.get(goalId);
      if (!goal || goal.deletedAt) return defaultProgress;

      const allocated = await goalAllocationRepository.getSumByGoalId(goalId);
      const spent = await goalSpendLinkRepository.getSumByGoalId(goalId);
      const saved = allocated - spent;
      const remaining = goal.targetAmount - saved;
      const percent =
        goal.targetAmount > 0
          ? Math.min((saved / goal.targetAmount) * 100, 100)
          : 0;
      const isOverfunded = saved > goal.targetAmount;

      return { allocated, spent, saved, remaining, percent, isOverfunded };
    },
    [goalId],
    defaultProgress
  );
}

interface GoalsSummaryData {
  totalSaved: number;
  totalRemaining: number;
  totalTarget: number;
  activeCount: number;
}

const defaultSummary: GoalsSummaryData = {
  totalSaved: 0,
  totalRemaining: 0,
  totalTarget: 0,
  activeCount: 0,
};

export function useGoalsSummary(): GoalsSummaryData {
  return useLiveQuery(
    async (): Promise<GoalsSummaryData> => {
      const goals = await db.goals.filter((g) => !g.archived && !g.deletedAt).toArray();
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
    },
    [],
    defaultSummary
  );
}
