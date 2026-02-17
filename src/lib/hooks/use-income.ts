"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";

export function useIncome(month: string) {
  return useLiveQuery(
    async () => {
      const results = await db.incomeEntries.where("month").equals(month).toArray();
      return results.filter((e) => !e.deletedAt);
    },
    [month],
    []
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
