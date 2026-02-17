import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { GoalAllocation } from "@/lib/types";

class GoalAllocationRepository extends BaseRepository<GoalAllocation> {
  constructor() {
    super(db.goalAllocations);
  }

  async getByGoalId(goalId: string): Promise<GoalAllocation[]> {
    return this.table.where("goalId").equals(goalId).reverse().sortBy("date");
  }

  async getSumByGoalId(goalId: string): Promise<number> {
    const allocations = await this.table
      .where("goalId")
      .equals(goalId)
      .toArray();
    return allocations.reduce((sum: number, a: GoalAllocation) => sum + a.amount, 0);
  }

  async deleteByGoalId(goalId: string): Promise<void> {
    await this.table.where("goalId").equals(goalId).delete();
  }
}

export const goalAllocationRepository = new GoalAllocationRepository();
