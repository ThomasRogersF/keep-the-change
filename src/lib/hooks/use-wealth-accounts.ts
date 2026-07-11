"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";
import type { WealthAccount } from "@/lib/types";

export function useWealthAccounts(): WealthAccount[] | undefined {
  return useLiveQuery(
    async () => (await db.wealthAccounts.toArray()).filter((a) => !a.deletedAt && !a.archived),
    [],
    undefined
  );
}

export function useWealthAccount(id: string | undefined): WealthAccount | undefined {
  return useLiveQuery(
    async () => {
      if (!id) return undefined;
      const account = await db.wealthAccounts.get(id);
      if (account && account.deletedAt) return undefined;
      return account;
    },
    [id],
    undefined
  );
}

export function useWealthAccountsByType(type: "cash" | "brokerage"): WealthAccount[] | undefined {
  return useLiveQuery(
    async () => {
      const results = await db.wealthAccounts.where("type").equals(type).toArray();
      return results.filter((a) => !a.deletedAt && !a.archived);
    },
    [type],
    undefined
  );
}
