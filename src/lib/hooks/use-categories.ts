"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";

export function useCategories() {
  return useLiveQuery(() => db.categories.toArray(), [], []);
}
