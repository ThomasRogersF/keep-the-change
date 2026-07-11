import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { EmergencyFund } from "@/lib/types";

class EmergencyFundRepository extends BaseRepository<EmergencyFund> {
  constructor() {
    super(db.emergencyFunds);
  }

  async getByWealthAccountId(wealthAccountId: string): Promise<EmergencyFund[]> {
    const results = await this.table.where("wealthAccountId").equals(wealthAccountId).toArray();
    return results.filter((f: EmergencyFund) => !f.deletedAt);
  }
}

export const emergencyFundRepository = new EmergencyFundRepository();
