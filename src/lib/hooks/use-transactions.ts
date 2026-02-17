"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";
import { useFiltersStore } from "@/lib/stores/filters.store";

export function useTransactions() {
  const {
    search,
    dateRange,
    selectedCategories,
    selectedAccounts,
    transactionType,
    amountRange,
  } = useFiltersStore();

  return useLiveQuery(
    async () => {
      let results = await db.transactions.orderBy("date").reverse().toArray();

      // Filter out soft-deleted records
      results = results.filter((t) => !t.deletedAt);

      if (transactionType !== "all") {
        results = results.filter((t) => t.type === transactionType);
      }

      if (search) {
        const s = search.toLowerCase();
        results = results.filter(
          (t) =>
            t.note?.toLowerCase().includes(s) ||
            t.tags?.some((tag) => tag.toLowerCase().includes(s))
        );
      }

      if (dateRange.from) {
        results = results.filter((t) => t.date >= dateRange.from!);
      }
      if (dateRange.to) {
        results = results.filter((t) => t.date <= dateRange.to!);
      }

      if (selectedCategories.length > 0) {
        results = results.filter(
          (t) => t.categoryId && selectedCategories.includes(t.categoryId)
        );
      }

      if (selectedAccounts.length > 0) {
        results = results.filter((t) =>
          selectedAccounts.includes(t.accountId)
        );
      }

      if (amountRange.min !== null) {
        results = results.filter((t) => t.amount >= amountRange.min!);
      }
      if (amountRange.max !== null) {
        results = results.filter((t) => t.amount <= amountRange.max!);
      }

      return results;
    },
    [search, dateRange, selectedCategories, selectedAccounts, transactionType, amountRange],
    []
  );
}
