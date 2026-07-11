import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { AssetHolding } from "@/lib/types";

class AssetHoldingRepository extends BaseRepository<AssetHolding> {
  constructor() {
    super(db.assetHoldings);
  }

  async getByWealthAccountId(wealthAccountId: string): Promise<AssetHolding[]> {
    const results = await this.table.where("wealthAccountId").equals(wealthAccountId).toArray();
    return results.filter((h: AssetHolding) => !h.deletedAt);
  }
}

export const assetHoldingRepository = new AssetHoldingRepository();
