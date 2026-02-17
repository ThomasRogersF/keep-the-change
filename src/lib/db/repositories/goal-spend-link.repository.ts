import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { GoalSpendLink } from "@/lib/types";

class GoalSpendLinkRepository extends BaseRepository<GoalSpendLink> {
  constructor() {
    super(db.goalSpendLinks);
  }

  async getByGoalId(goalId: string): Promise<GoalSpendLink[]> {
    const results = await this.table.where("goalId").equals(goalId).toArray();
    return results.filter((l: GoalSpendLink) => !l.deletedAt);
  }

  async getByTransactionId(transactionId: string): Promise<GoalSpendLink[]> {
    const results = await this.table
      .where("transactionId")
      .equals(transactionId)
      .toArray();
    return results.filter((l: GoalSpendLink) => !l.deletedAt);
  }

  async getSumByGoalId(goalId: string): Promise<number> {
    const links = await this.table
      .where("goalId")
      .equals(goalId)
      .toArray();
    return links
      .filter((l: GoalSpendLink) => !l.deletedAt)
      .reduce((sum: number, l: GoalSpendLink) => sum + l.amountApplied, 0);
  }

  async deleteByGoalId(goalId: string): Promise<void> {
    const now = new Date();
    await this.table
      .where("goalId")
      .equals(goalId)
      .modify({ deletedAt: now, updatedAt: now });
  }

  async deleteByTransactionId(transactionId: string): Promise<void> {
    const now = new Date();
    await this.table
      .where("transactionId")
      .equals(transactionId)
      .modify({ deletedAt: now, updatedAt: now });
  }
}

export const goalSpendLinkRepository = new GoalSpendLinkRepository();
