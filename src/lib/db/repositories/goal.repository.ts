import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { Goal } from "@/lib/types";

class GoalRepository extends BaseRepository<Goal> {
  constructor() {
    super(db.goals);
  }

  async getActive(): Promise<Goal[]> {
    const results = await this.table.where("archived").equals(0).toArray();
    return results.filter((g: Goal) => !g.deletedAt);
  }

  async getArchived(): Promise<Goal[]> {
    const results = await this.table.where("archived").equals(1).toArray();
    return results.filter((g: Goal) => !g.deletedAt);
  }

  async getByAccount(accountId: string): Promise<Goal[]> {
    const results = await this.table.where("accountId").equals(accountId).toArray();
    return results.filter((g: Goal) => !g.deletedAt);
  }

  async archive(id: string): Promise<void> {
    await this.table.update(id, { archived: true, updatedAt: new Date() });
  }

  async unarchive(id: string): Promise<void> {
    await this.table.update(id, { archived: false, updatedAt: new Date() });
  }
}

export const goalRepository = new GoalRepository();
