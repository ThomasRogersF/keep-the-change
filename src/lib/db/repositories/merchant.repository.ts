import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { Merchant } from "@/lib/types";

class MerchantRepository extends BaseRepository<Merchant> {
  constructor() {
    super(db.merchants);
  }

  async getByName(name: string): Promise<Merchant | undefined> {
    const result = await this.table.where("name").equals(name).first();
    if (result && result.deletedAt) return undefined;
    return result;
  }

  async getOrCreate(name: string): Promise<string> {
    const existing = await this.getByName(name);
    if (existing) return existing.id;
    return this.create({ name });
  }
}

export const merchantRepository = new MerchantRepository();
