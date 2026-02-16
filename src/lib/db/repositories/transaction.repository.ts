import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { Transaction } from "@/lib/types";

class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super(db.transactions);
  }

  async getByDateRange(start: Date, end: Date): Promise<Transaction[]> {
    return this.table
      .where("date")
      .between(start, end, true, true)
      .reverse()
      .sortBy("date");
  }

  async getByAccount(accountId: string): Promise<Transaction[]> {
    return this.table.where("accountId").equals(accountId).toArray();
  }

  async getByCategory(categoryId: string): Promise<Transaction[]> {
    return this.table.where("categoryId").equals(categoryId).toArray();
  }

  async getExpensesForMonth(
    month: string,
    mainAccountIds: string[]
  ): Promise<Transaction[]> {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59);
    return this.table
      .where("date")
      .between(start, end, true, true)
      .filter(
        (t: Transaction) => t.type === "expense" && mainAccountIds.includes(t.accountId)
      )
      .toArray();
  }

  async getAllForMonth(month: string): Promise<Transaction[]> {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59);
    return this.table
      .where("date")
      .between(start, end, true, true)
      .reverse()
      .sortBy("date");
  }

  async getRecent(limit: number): Promise<Transaction[]> {
    return this.table.orderBy("date").reverse().limit(limit).toArray();
  }
}

export const transactionRepository = new TransactionRepository();
