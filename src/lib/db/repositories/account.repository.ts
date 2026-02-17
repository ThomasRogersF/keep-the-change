import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { Account } from "@/lib/types";

class AccountRepository extends BaseRepository<Account> {
  constructor() {
    super(db.accounts);
  }

  async getByType(type: "main" | "external"): Promise<Account[]> {
    const results = await this.table.where("type").equals(type).toArray();
    return results.filter((a: Account) => !a.deletedAt);
  }

  async getMainAccountIds(): Promise<string[]> {
    const accounts = await this.getByType("main");
    return accounts.map((a) => a.id);
  }
}

export const accountRepository = new AccountRepository();
