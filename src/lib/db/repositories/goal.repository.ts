import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { Goal } from "@/lib/types";

class GoalRepository extends BaseRepository<Goal> {
  constructor() {
    super(db.goals);
  }

  async getActive(): Promise<Goal[]> {
    return this.table.where("archived").equals(0).toArray();
  }

  async getArchived(): Promise<Goal[]> {
    return this.table.where("archived").equals(1).toArray();
  }

  async getByAccount(accountId: string): Promise<Goal[]> {
    return this.table.where("accountId").equals(accountId).toArray();
  }

  async archive(id: string): Promise<void> {
    await this.table.update(id, { archived: true, updatedAt: new Date() });
  }

  async unarchive(id: string): Promise<void> {
    await this.table.update(id, { archived: false, updatedAt: new Date() });
  }
}

export const goalRepository = new GoalRepository();
