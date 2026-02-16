"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";

export function useMerchants() {
  return useLiveQuery(() => db.merchants.toArray(), [], []);
}
