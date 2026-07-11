import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { EmergencyFundActivity } from "@/lib/types";

class EmergencyFundActivityRepository extends BaseRepository<EmergencyFundActivity> {
  constructor() {
    super(db.emergencyFundActivities);
  }

  async getByFundId(emergencyFundId: string): Promise<EmergencyFundActivity[]> {
    const results = await this.table
      .where("emergencyFundId")
      .equals(emergencyFundId)
      .reverse()
      .sortBy("date");
    return results.filter((a: EmergencyFundActivity) => !a.deletedAt);
  }

  async getSumByFundId(
    emergencyFundId: string,
    type?: "contribution" | "withdrawal"
  ): Promise<number> {
    const activities = await this.getByFundId(emergencyFundId);
    return activities
      .filter((a) => !type || a.type === type)
      .reduce((sum, a) => sum + a.amount, 0);
  }

  async deleteByFundId(emergencyFundId: string): Promise<void> {
    const now = new Date();
    await this.table
      .where("emergencyFundId")
      .equals(emergencyFundId)
      .modify({ deletedAt: now, updatedAt: now });
  }
}

export const emergencyFundActivityRepository = new EmergencyFundActivityRepository();
