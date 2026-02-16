import Dexie, { type EntityTable } from "dexie";
import type {
  Account,
  Category,
  Merchant,
  Transaction,
  Subscription,
  IncomeEntry,
} from "@/lib/types";

class LedgerlyDB extends Dexie {
  accounts!: EntityTable<Account, "id">;
  categories!: EntityTable<Category, "id">;
  merchants!: EntityTable<Merchant, "id">;
  transactions!: EntityTable<Transaction, "id">;
  subscriptions!: EntityTable<Subscription, "id">;
  incomeEntries!: EntityTable<IncomeEntry, "id">;

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
  }
}

export const db = new LedgerlyDB();
