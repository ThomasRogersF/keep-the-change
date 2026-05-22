"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";

export function useSubscriptions() {
  return useLiveQuery(
    async () => {
      const all = await db.subscriptions.toArray();
      return all.filter((s) => !s.deletedAt);
    },
    [],
    undefined
  );
}

export function useActiveSubscriptions() {
  return useLiveQuery(
    async () => {
      const all = await db.subscriptions.toArray();
      return all.filter((s) => !s.deletedAt && s.active);
    },
    [],
    []
  );
}
