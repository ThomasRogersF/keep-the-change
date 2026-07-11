"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { internalTransferRepository } from "@/lib/db/repositories/internal-transfer.repository";
import type { InternalTransfer } from "@/lib/types";

export function useInternalTransfers(): InternalTransfer[] {
  return useLiveQuery(() => internalTransferRepository.getAllSorted(), [], []);
}

export function useInternalTransfersForAccount(
  type: "account" | "wealthAccount" | undefined,
  id: string | undefined
): InternalTransfer[] {
  return useLiveQuery(
    () => (type && id ? internalTransferRepository.getByAccountRef(type, id) : Promise.resolve([])),
    [type, id],
    []
  );
}
