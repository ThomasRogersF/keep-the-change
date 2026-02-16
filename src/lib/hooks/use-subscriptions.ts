"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";

export function useSubscriptions() {
  return useLiveQuery(() => db.subscriptions.toArray(), [], []);
}

export function useActiveSubscriptions() {
  return useLiveQuery(
    async () => {
      const all = await db.subscriptions.toArray();
      return all.filter((s) => s.active);
    },
    [],
    []
  );
}
