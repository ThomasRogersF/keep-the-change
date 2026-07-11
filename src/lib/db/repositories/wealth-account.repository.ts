import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { WealthAccount } from "@/lib/types";

class WealthAccountRepository extends BaseRepository<WealthAccount> {
  constructor() {
    super(db.wealthAccounts);
  }

  async getByType(type: "cash" | "brokerage"): Promise<WealthAccount[]> {
    const results = await this.table.where("type").equals(type).toArray();
    return results.filter((a: WealthAccount) => !a.deletedAt && !a.archived);
  }

  async getActive(): Promise<WealthAccount[]> {
    const all = await this.getAll();
    return all.filter((a) => !a.archived);
  }

  async archive(id: string): Promise<void> {
    await this.table.update(id, { archived: true, updatedAt: new Date() });
  }

  async adjustBalance(id: string, delta: number): Promise<void> {
    const account = await this.getById(id);
    if (!account) throw new Error("Wealth account not found");
    await this.table.update(id, {
      balance: account.balance + delta,
      updatedAt: new Date(),
    });
  }
}

export const wealthAccountRepository = new WealthAccountRepository();
