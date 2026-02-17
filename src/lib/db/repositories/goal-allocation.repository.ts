import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { GoalAllocation } from "@/lib/types";

class GoalAllocationRepository extends BaseRepository<GoalAllocation> {
  constructor() {
    super(db.goalAllocations);
  }

  async getByGoalId(goalId: string): Promise<GoalAllocation[]> {
    const results = await this.table.where("goalId").equals(goalId).reverse().sortBy("date");
    return results.filter((a: GoalAllocation) => !a.deletedAt);
  }

  async getSumByGoalId(goalId: string): Promise<number> {
    const allocations = await this.table
      .where("goalId")
      .equals(goalId)
      .toArray();
    return allocations
      .filter((a: GoalAllocation) => !a.deletedAt)
      .reduce((sum: number, a: GoalAllocation) => sum + a.amount, 0);
  }

  async deleteByGoalId(goalId: string): Promise<void> {
    const now = new Date();
    await this.table
      .where("goalId")
      .equals(goalId)
      .modify({ deletedAt: now, updatedAt: now });
  }
}

export const goalAllocationRepository = new GoalAllocationRepository();
