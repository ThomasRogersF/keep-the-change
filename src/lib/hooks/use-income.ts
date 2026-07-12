"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";
import { format, subMonths } from "date-fns";

export function useIncomeTrend(month: string) {
  return useLiveQuery(
    async () => {
      const [year, mon] = month.split("-").map(Number);
      const trend = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(year, mon - 1, 1), i);
        const m = format(d, "yyyy-MM");
        const incEntries = (await db.incomeEntries
          .where("month")
          .equals(m)
          .toArray()).filter((e) => !e.deletedAt);
        const income = incEntries.reduce((s, e) => s + e.amount, 0);
        trend.push({
          month: m,
          label: format(d, "MMM"),
          income,
        });
      }
      return trend;
    },
    [month],
    undefined
  );
}

export function useIncome(month: string) {
  return useLiveQuery(
    async () => {
      const results = await db.incomeEntries.where("month").equals(month).toArray();
      return results.filter((e) => !e.deletedAt);
    },
    [month],
    undefined
  );
}

export function useIncomeTotal(month: string) {
  return useLiveQuery(
    async () => {
      const entries = await db.incomeEntries
        .where("month")
        .equals(month)
        .toArray();
      return entries
        .filter((e) => !e.deletedAt)
        .reduce((sum, e) => sum + e.amount, 0);
    },
    [month],
    0
  );
}
