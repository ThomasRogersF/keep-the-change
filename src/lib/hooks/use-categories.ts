"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";

export function useCategories() {
  return useLiveQuery(
    async () => {
      const all = await db.categories.toArray();
      return all.filter((c) => !c.deletedAt);
    },
    [],
    undefined
  );
}
