import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { GoalSpendLink } from "@/lib/types";

class GoalSpendLinkRepository extends BaseRepository<GoalSpendLink> {
  constructor() {
    super(db.goalSpendLinks);
  }

  async getByGoalId(goalId: string): Promise<GoalSpendLink[]> {
    return this.table.where("goalId").equals(goalId).toArray();
  }

  async getByTransactionId(transactionId: string): Promise<GoalSpendLink[]> {
    return this.table
      .where("transactionId")
      .equals(transactionId)
      .toArray();
  }

  async getSumByGoalId(goalId: string): Promise<number> {
    const links = await this.table
      .where("goalId")
      .equals(goalId)
      .toArray();
    return links.reduce((sum: number, l: GoalSpendLink) => sum + l.amountApplied, 0);
  }

  async deleteByGoalId(goalId: string): Promise<void> {
    await this.table.where("goalId").equals(goalId).delete();
  }

  async deleteByTransactionId(transactionId: string): Promise<void> {
    await this.table.where("transactionId").equals(transactionId).delete();
  }
}

export const goalSpendLinkRepository = new GoalSpendLinkRepository();
