"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";

export function useAccounts() {
  return useLiveQuery(() => db.accounts.toArray(), [], []);
}

export function useMainAccounts() {
  return useLiveQuery(
    () => db.accounts.where("type").equals("main").toArray(),
    [],
    []
  );
}

export function useExternalAccounts() {
  return useLiveQuery(
    () => db.accounts.where("type").equals("external").toArray(),
    [],
    []
  );
}
