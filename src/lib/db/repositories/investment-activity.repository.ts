import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { InvestmentActivity } from "@/lib/types";

class InvestmentActivityRepository extends BaseRepository<InvestmentActivity> {
  constructor() {
    super(db.investmentActivities);
  }

  async getByHoldingId(assetHoldingId: string): Promise<InvestmentActivity[]> {
    const results = await this.table
      .where("assetHoldingId")
      .equals(assetHoldingId)
      .reverse()
      .sortBy("date");
    return results.filter((a: InvestmentActivity) => !a.deletedAt);
  }

  async getByAccountId(wealthAccountId: string): Promise<InvestmentActivity[]> {
    const results = await this.table
      .where("wealthAccountId")
      .equals(wealthAccountId)
      .reverse()
      .sortBy("date");
    return results.filter((a: InvestmentActivity) => !a.deletedAt);
  }

  async deleteByHoldingId(assetHoldingId: string): Promise<void> {
    const now = new Date();
    await this.table
      .where("assetHoldingId")
      .equals(assetHoldingId)
      .modify({ deletedAt: now, updatedAt: now });
  }
}

export const investmentActivityRepository = new InvestmentActivityRepository();
