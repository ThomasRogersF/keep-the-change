import type {
  Account,
  Category,
  Merchant,
  Transaction,
  Subscription,
  IncomeEntry,
  Goal,
  GoalAllocation,
  GoalSpendLink,
} from "@/lib/types";
import type { TableDescriptor, RemoteRow } from "./types";

function dateOrNull(val: unknown): Date | null {
  if (!val) return null;
  return new Date(val as string);
}

function toISOOrNull(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

const accountDescriptor: TableDescriptor<Account> = {
  name: "accounts",
  localTable: "accounts",
  remoteTable: "accounts",
  toRemote: (row, userId) => ({
    id: row.id,
    user_id: userId,
    name: row.name,
    type: row.type,
    currency: row.currency,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    deleted_at: toISOOrNull(row.deletedAt),
  }),
  toLocal: (row: RemoteRow): Account => ({
    id: row.id as string,
    name: row.name as string,
    type: row.type as "main" | "external",
    currency: row.currency as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: dateOrNull(row.deleted_at),
  }),
};

const categoryDescriptor: TableDescriptor<Category> = {
  name: "categories",
  localTable: "categories",
  remoteTable: "categories",
  toRemote: (row, userId) => ({
    id: row.id,
    user_id: userId,
    name: row.name,
    icon: row.icon,
    color_token: row.colorToken,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    deleted_at: toISOOrNull(row.deletedAt),
  }),
  toLocal: (row: RemoteRow): Category => ({
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    colorToken: row.color_token as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: dateOrNull(row.deleted_at),
  }),
};

const merchantDescriptor: TableDescriptor<Merchant> = {
  name: "merchants",
  localTable: "merchants",
  remoteTable: "merchants",
  toRemote: (row, userId) => ({
    id: row.id,
    user_id: userId,
    name: row.name,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    deleted_at: toISOOrNull(row.deletedAt),
  }),
  toLocal: (row: RemoteRow): Merchant => ({
    id: row.id as string,
    name: row.name as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: dateOrNull(row.deleted_at),
  }),
};

const transactionDescriptor: TableDescriptor<Transaction> = {
  name: "transactions",
  localTable: "transactions",
  remoteTable: "transactions",
  toRemote: (row, userId) => ({
    id: row.id,
    user_id: userId,
    date: toDateStr(row.date),
    amount: row.amount,
    type: row.type,
    category_id: row.categoryId ?? null,
    merchant_id: row.merchantId ?? null,
    account_id: row.accountId,
    note: row.note ?? null,
    tags: row.tags,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    deleted_at: toISOOrNull(row.deletedAt),
  }),
  toLocal: (row: RemoteRow): Transaction => ({
    id: row.id as string,
    date: new Date(row.date as string),
    amount: Number(row.amount),
    type: row.type as "expense" | "income",
    categoryId: (row.category_id as string) || undefined,
    merchantId: (row.merchant_id as string) || undefined,
    accountId: row.account_id as string,
    note: (row.note as string) || undefined,
    tags: (row.tags as string[]) || [],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: dateOrNull(row.deleted_at),
  }),
};

const subscriptionDescriptor: TableDescriptor<Subscription> = {
  name: "subscriptions",
  localTable: "subscriptions",
  remoteTable: "subscriptions",
  toRemote: (row, userId) => ({
    id: row.id,
    user_id: userId,
    name: row.name,
    amount: row.amount,
    cadence: row.cadence,
    next_renewal_date: toDateStr(row.nextRenewalDate),
    account_id: row.accountId,
    category_id: row.categoryId ?? null,
    merchant_id: row.merchantId ?? null,
    active: row.active,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    deleted_at: toISOOrNull(row.deletedAt),
  }),
  toLocal: (row: RemoteRow): Subscription => ({
    id: row.id as string,
    name: row.name as string,
    amount: Number(row.amount),
    cadence: row.cadence as "weekly" | "monthly" | "yearly",
    nextRenewalDate: new Date(row.next_renewal_date as string),
    accountId: row.account_id as string,
    categoryId: (row.category_id as string) || undefined,
    merchantId: (row.merchant_id as string) || undefined,
    active: row.active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: dateOrNull(row.deleted_at),
  }),
};

const incomeEntryDescriptor: TableDescriptor<IncomeEntry> = {
  name: "incomeEntries",
  localTable: "incomeEntries",
  remoteTable: "income_entries",
  toRemote: (row, userId) => ({
    id: row.id,
    user_id: userId,
    month: row.month,
    source: row.source,
    amount: row.amount,
    note: row.note ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    deleted_at: toISOOrNull(row.deletedAt),
  }),
  toLocal: (row: RemoteRow): IncomeEntry => ({
    id: row.id as string,
    month: row.month as string,
    source: row.source as string,
    amount: Number(row.amount),
    note: (row.note as string) || undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: dateOrNull(row.deleted_at),
  }),
};

const goalDescriptor: TableDescriptor<Goal> = {
  name: "goals",
  localTable: "goals",
  remoteTable: "goals",
  toRemote: (row, userId) => ({
    id: row.id,
    user_id: userId,
    name: row.name,
    target_amount: row.targetAmount,
    target_date: row.targetDate ?? null,
    account_id: row.accountId,
    archived: row.archived,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    deleted_at: toISOOrNull(row.deletedAt),
  }),
  toLocal: (row: RemoteRow): Goal => ({
    id: row.id as string,
    name: row.name as string,
    targetAmount: Number(row.target_amount),
    targetDate: (row.target_date as string) || undefined,
    accountId: row.account_id as string,
    archived: row.archived as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: dateOrNull(row.deleted_at),
  }),
};

const goalAllocationDescriptor: TableDescriptor<GoalAllocation> = {
  name: "goalAllocations",
  localTable: "goalAllocations",
  remoteTable: "goal_allocations",
  toRemote: (row, userId) => ({
    id: row.id,
    user_id: userId,
    goal_id: row.goalId,
    date: row.date,
    amount: row.amount,
    note: row.note ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    deleted_at: toISOOrNull(row.deletedAt),
  }),
  toLocal: (row: RemoteRow): GoalAllocation => ({
    id: row.id as string,
    goalId: row.goal_id as string,
    date: row.date as string,
    amount: Number(row.amount),
    note: (row.note as string) || undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: dateOrNull(row.deleted_at),
  }),
};

const goalSpendLinkDescriptor: TableDescriptor<GoalSpendLink> = {
  name: "goalSpendLinks",
  localTable: "goalSpendLinks",
  remoteTable: "goal_spend_links",
  toRemote: (row, userId) => ({
    id: row.id,
    user_id: userId,
    goal_id: row.goalId,
    transaction_id: row.transactionId,
    amount_applied: row.amountApplied,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    deleted_at: toISOOrNull(row.deletedAt),
  }),
  toLocal: (row: RemoteRow): GoalSpendLink => ({
    id: row.id as string,
    goalId: row.goal_id as string,
    transactionId: row.transaction_id as string,
    amountApplied: Number(row.amount_applied),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    deletedAt: dateOrNull(row.deleted_at),
  }),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ALL_DESCRIPTORS: TableDescriptor<any>[] = [
  accountDescriptor,
  categoryDescriptor,
  merchantDescriptor,
  transactionDescriptor,
  subscriptionDescriptor,
  incomeEntryDescriptor,
  goalDescriptor,
  goalAllocationDescriptor,
  goalSpendLinkDescriptor,
];
