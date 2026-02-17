"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";

export function useMerchants() {
  return useLiveQuery(
    async () => {
      const all = await db.merchants.toArray();
      return all.filter((m) => !m.deletedAt);
    },
    [],
    []
  );
}
