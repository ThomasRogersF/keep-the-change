import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { YieldRateHistory } from "@/lib/types";

class YieldRateHistoryRepository extends BaseRepository<YieldRateHistory> {
  constructor() {
    super(db.yieldRateHistories);
  }

  async getByProfileId(yieldProfileId: string): Promise<YieldRateHistory[]> {
    const results = await this.table
      .where("yieldProfileId")
      .equals(yieldProfileId)
      .reverse()
      .sortBy("effectiveDate");
    return results.filter((r: YieldRateHistory) => !r.deletedAt);
  }

  async deleteByProfileId(yieldProfileId: string): Promise<void> {
    const now = new Date();
    await this.table
      .where("yieldProfileId")
      .equals(yieldProfileId)
      .modify({ deletedAt: now, updatedAt: now });
  }
}

export const yieldRateHistoryRepository = new YieldRateHistoryRepository();
