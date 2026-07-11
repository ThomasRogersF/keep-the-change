import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { YieldProfile } from "@/lib/types";

class YieldProfileRepository extends BaseRepository<YieldProfile> {
  constructor() {
    super(db.yieldProfiles);
  }

  async getByWealthAccountId(wealthAccountId: string): Promise<YieldProfile | undefined> {
    const results = await this.table.where("wealthAccountId").equals(wealthAccountId).toArray();
    return results.find((p: YieldProfile) => !p.deletedAt);
  }

  async deleteByWealthAccountId(wealthAccountId: string): Promise<void> {
    const now = new Date();
    await this.table
      .where("wealthAccountId")
      .equals(wealthAccountId)
      .modify({ deletedAt: now, updatedAt: now });
  }
}

export const yieldProfileRepository = new YieldProfileRepository();
