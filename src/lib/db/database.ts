import Dexie, { type EntityTable } from "dexie";
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
  SyncState,
  WealthAccount,
  EmergencyFund,
  EmergencyFundActivity,
  YieldProfile,
  YieldRateHistory,
  AssetHolding,
  InvestmentActivity,
  InternalTransfer,
} from "@/lib/types";

class LedgerlyDB extends Dexie {
  accounts!: EntityTable<Account, "id">;
  categories!: EntityTable<Category, "id">;
  merchants!: EntityTable<Merchant, "id">;
  transactions!: EntityTable<Transaction, "id">;
  subscriptions!: EntityTable<Subscription, "id">;
  incomeEntries!: EntityTable<IncomeEntry, "id">;
  goals!: EntityTable<Goal, "id">;
  goalAllocations!: EntityTable<GoalAllocation, "id">;
  goalSpendLinks!: EntityTable<GoalSpendLink, "id">;
  syncState!: EntityTable<SyncState, "userId">;
  wealthAccounts!: EntityTable<WealthAccount, "id">;
  emergencyFunds!: EntityTable<EmergencyFund, "id">;
  emergencyFundActivities!: EntityTable<EmergencyFundActivity, "id">;
  yieldProfiles!: EntityTable<YieldProfile, "id">;
  yieldRateHistories!: EntityTable<YieldRateHistory, "id">;
  assetHoldings!: EntityTable<AssetHolding, "id">;
  investmentActivities!: EntityTable<InvestmentActivity, "id">;
  internalTransfers!: EntityTable<InternalTransfer, "id">;

  constructor() {
    super("LedgerlyDB");
    this.version(1).stores({
      accounts: "id, name, type, createdAt",
      categories: "id, name, createdAt",
      merchants: "id, name, createdAt",
      transactions: "id, date, type, categoryId, merchantId, accountId, createdAt",
      subscriptions: "id, name, nextRenewalDate, accountId, active, createdAt",
      incomeEntries: "id, month, source, createdAt",
    });
    this.version(2).stores({
      accounts: "id, name, type, createdAt",
      categories: "id, name, createdAt",
      merchants: "id, name, createdAt",
      transactions: "id, date, type, categoryId, merchantId, accountId, createdAt",
      subscriptions: "id, name, nextRenewalDate, accountId, active, createdAt",
      incomeEntries: "id, month, source, createdAt",
      goals: "id, accountId, archived, createdAt",
      goalAllocations: "id, goalId, date, createdAt",
      goalSpendLinks: "id, goalId, transactionId, createdAt",
    });
    this.version(3)
      .stores({
        accounts: "id, name, type, createdAt, updatedAt, deletedAt",
        categories: "id, name, createdAt, updatedAt, deletedAt",
        merchants: "id, name, createdAt, updatedAt, deletedAt",
        transactions: "id, date, type, categoryId, merchantId, accountId, createdAt, updatedAt, deletedAt",
        subscriptions: "id, name, nextRenewalDate, accountId, active, createdAt, updatedAt, deletedAt",
        incomeEntries: "id, month, source, createdAt, updatedAt, deletedAt",
        goals: "id, accountId, archived, createdAt, updatedAt, deletedAt",
        goalAllocations: "id, goalId, date, createdAt, updatedAt, deletedAt",
        goalSpendLinks: "id, goalId, transactionId, createdAt, updatedAt, deletedAt",
        syncState: "userId",
      })
      .upgrade(async (tx) => {
        // Backfill updatedAt for Account, Category, Merchant (they previously lacked it)
        for (const tableName of ["accounts", "categories", "merchants"] as const) {
          await tx
            .table(tableName)
            .toCollection()
            .modify((record: Record<string, unknown>) => {
              if (!record.updatedAt) {
                record.updatedAt = (record.createdAt as Date) || new Date();
              }
              if (record.deletedAt === undefined) {
                record.deletedAt = null;
              }
            });
        }
        // Backfill deletedAt=null for tables that already have updatedAt
        for (const tableName of [
          "transactions",
          "subscriptions",
          "incomeEntries",
          "goals",
          "goalAllocations",
          "goalSpendLinks",
        ] as const) {
          await tx
            .table(tableName)
            .toCollection()
            .modify((record: Record<string, unknown>) => {
              if (record.deletedAt === undefined) {
                record.deletedAt = null;
              }
            });
        }
      });
    this.version(4).stores({
      accounts: "id, name, type, createdAt, updatedAt, deletedAt",
      categories: "id, name, createdAt, updatedAt, deletedAt",
      merchants: "id, name, createdAt, updatedAt, deletedAt",
      transactions: "id, date, type, categoryId, merchantId, accountId, createdAt, updatedAt, deletedAt",
      subscriptions: "id, name, nextRenewalDate, accountId, active, createdAt, updatedAt, deletedAt",
      incomeEntries: "id, month, source, createdAt, updatedAt, deletedAt",
      goals: "id, accountId, archived, createdAt, updatedAt, deletedAt",
      goalAllocations: "id, goalId, date, createdAt, updatedAt, deletedAt",
      goalSpendLinks: "id, goalId, transactionId, createdAt, updatedAt, deletedAt",
      syncState: "userId",
      wealthAccounts: "id, type, archived, createdAt, updatedAt, deletedAt",
      emergencyFunds: "id, wealthAccountId, createdAt, updatedAt, deletedAt",
      emergencyFundActivities: "id, emergencyFundId, date, type, createdAt, updatedAt, deletedAt",
      yieldProfiles: "id, wealthAccountId, createdAt, updatedAt, deletedAt",
      yieldRateHistories: "id, yieldProfileId, effectiveDate, createdAt, updatedAt, deletedAt",
      assetHoldings: "id, wealthAccountId, assetType, symbol, createdAt, updatedAt, deletedAt",
      investmentActivities: "id, wealthAccountId, assetHoldingId, type, date, createdAt, updatedAt, deletedAt",
      internalTransfers: "id, fromId, toId, date, createdAt, updatedAt, deletedAt",
    });
  }
}

export const db = new LedgerlyDB();
