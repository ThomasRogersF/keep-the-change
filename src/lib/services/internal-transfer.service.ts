import { db } from "@/lib/db/database";
import { accountRepository } from "@/lib/db/repositories/account.repository";
import { wealthAccountRepository } from "@/lib/db/repositories/wealth-account.repository";
import { internalTransferRepository } from "@/lib/db/repositories/internal-transfer.repository";
import type { InternalTransfer } from "@/lib/types";

export type AccountRefType = "account" | "wealthAccount";

export interface AccountRef {
  id: string;
  name: string;
  currency: string;
  balance?: number; // only present for wealthAccount refs
}

export async function resolveAccountRef(
  type: AccountRefType,
  id: string
): Promise<AccountRef | undefined> {
  if (type === "account") {
    const account = await accountRepository.getById(id);
    if (!account) return undefined;
    return { id: account.id, name: account.name, currency: account.currency };
  }
  const wealthAccount = await wealthAccountRepository.getById(id);
  if (!wealthAccount) return undefined;
  return {
    id: wealthAccount.id,
    name: wealthAccount.name,
    currency: wealthAccount.currency,
    balance: wealthAccount.balance,
  };
}

export interface TransferInput {
  date: string;
  amount: number;
  fromType: AccountRefType;
  fromId: string;
  toType: AccountRefType;
  toId: string;
  note?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  requiresConfirmation?: boolean;
}

export async function validateTransfer(input: TransferInput): Promise<ValidationResult> {
  if (input.amount <= 0) {
    return { valid: false, error: "Amount must be greater than zero" };
  }
  if (input.fromType === input.toType && input.fromId === input.toId) {
    return { valid: false, error: "Source and destination accounts must be different" };
  }

  const [from, to] = await Promise.all([
    resolveAccountRef(input.fromType, input.fromId),
    resolveAccountRef(input.toType, input.toId),
  ]);
  if (!from || !to) {
    return { valid: false, error: "One of the selected accounts could not be found" };
  }
  if (from.currency !== to.currency) {
    return {
      valid: false,
      error: "Cross-currency transfers aren't supported yet — both accounts must use the same currency.",
    };
  }
  if (input.fromType === "wealthAccount" && from.balance !== undefined && input.amount > from.balance) {
    return { valid: true, requiresConfirmation: true };
  }
  return { valid: true };
}

export async function executeInternalTransfer(
  input: TransferInput,
  options: { confirmInsufficientBalance?: boolean } = {}
): Promise<InternalTransfer> {
  const validation = await validateTransfer(input);
  if (!validation.valid) {
    throw new Error(validation.error ?? "Transfer is invalid");
  }
  if (validation.requiresConfirmation && !options.confirmInsufficientBalance) {
    throw new Error(
      "This transfer exceeds the source account's tracked balance and requires confirmation"
    );
  }

  return db.transaction("rw", [db.wealthAccounts, db.internalTransfers], async () => {
    if (input.fromType === "wealthAccount") {
      await wealthAccountRepository.adjustBalance(input.fromId, -input.amount);
    }
    if (input.toType === "wealthAccount") {
      await wealthAccountRepository.adjustBalance(input.toId, input.amount);
    }
    const id = crypto.randomUUID();
    const now = new Date();
    const record: InternalTransfer = {
      id,
      date: input.date,
      amount: input.amount,
      fromType: input.fromType,
      fromId: input.fromId,
      toType: input.toType,
      toId: input.toId,
      note: input.note,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await db.internalTransfers.add(record);
    return record;
  });
}

export async function deleteInternalTransfer(id: string): Promise<void> {
  await db.transaction("rw", [db.wealthAccounts, db.internalTransfers], async () => {
    const transfer = await internalTransferRepository.getById(id);
    if (!transfer) return;
    if (transfer.fromType === "wealthAccount") {
      await wealthAccountRepository.adjustBalance(transfer.fromId, transfer.amount);
    }
    if (transfer.toType === "wealthAccount") {
      await wealthAccountRepository.adjustBalance(transfer.toId, -transfer.amount);
    }
    await internalTransferRepository.delete(id);
  });
}
