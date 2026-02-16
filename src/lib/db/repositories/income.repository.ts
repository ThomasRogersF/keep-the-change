import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { IncomeEntry } from "@/lib/types";

class IncomeRepository extends BaseRepository<IncomeEntry> {
  constructor() {
    super(db.incomeEntries);
  }

  async getByMonth(month: string): Promise<IncomeEntry[]> {
    return this.table.where("month").equals(month).toArray();
  }

  async getTotalForMonth(month: string): Promise<number> {
    const entries = await this.getByMonth(month);
    return entries.reduce((sum, e) => sum + e.amount, 0);
  }

  async getMonthlyTotals(months: string[]): Promise<Map<string, number>> {
    const totals = new Map<string, number>();
    for (const month of months) {
      totals.set(month, await this.getTotalForMonth(month));
    }
    return totals;
  }
}

export const incomeRepository = new IncomeRepository();
