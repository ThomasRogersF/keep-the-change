"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";

export function useIncome(month: string) {
  return useLiveQuery(
    () => db.incomeEntries.where("month").equals(month).toArray(),
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
      return entries.reduce((sum, e) => sum + e.amount, 0);
    },
    [month],
    0
  );
}
