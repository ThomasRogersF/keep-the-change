"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";

export function useAccounts() {
  return useLiveQuery(
    async () => {
      const all = await db.accounts.toArray();
      return all.filter((a) => !a.deletedAt);
    },
    [],
    []
  );
}

export function useMainAccounts() {
  return useLiveQuery(
    async () => {
      const results = await db.accounts.where("type").equals("main").toArray();
      return results.filter((a) => !a.deletedAt);
    },
    [],
    []
  );
}

export function useExternalAccounts() {
  return useLiveQuery(
    async () => {
      const results = await db.accounts.where("type").equals("external").toArray();
      return results.filter((a) => !a.deletedAt);
    },
    [],
    []
  );
}
