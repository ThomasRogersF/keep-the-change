import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { Transaction } from "@/lib/types";

class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super(db.transactions);
  }

  async getByDateRange(start: Date, end: Date): Promise<Transaction[]> {
    const results = await this.table
      .where("date")
      .between(start, end, true, true)
      .reverse()
      .sortBy("date");
    return results.filter((t: Transaction) => !t.deletedAt);
  }

  async getByAccount(accountId: string): Promise<Transaction[]> {
    const results = await this.table.where("accountId").equals(accountId).toArray();
    return results.filter((t: Transaction) => !t.deletedAt);
  }

  async getByCategory(categoryId: string): Promise<Transaction[]> {
    const results = await this.table.where("categoryId").equals(categoryId).toArray();
    return results.filter((t: Transaction) => !t.deletedAt);
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
        (t: Transaction) => !t.deletedAt && t.type === "expense" && mainAccountIds.includes(t.accountId)
      )
      .toArray();
  }

  async getAllForMonth(month: string): Promise<Transaction[]> {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0, 23, 59, 59);
    const results = await this.table
      .where("date")
      .between(start, end, true, true)
      .reverse()
      .sortBy("date");
    return results.filter((t: Transaction) => !t.deletedAt);
  }

  async getRecent(limit: number): Promise<Transaction[]> {
    const all = await this.table.orderBy("date").reverse().toArray();
    return all.filter((t: Transaction) => !t.deletedAt).slice(0, limit);
  }
}

export const transactionRepository = new TransactionRepository();
