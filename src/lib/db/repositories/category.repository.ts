import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { Category } from "@/lib/types";

class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super(db.categories);
  }

  async getByName(name: string): Promise<Category | undefined> {
    const result = await this.table.where("name").equals(name).first();
    if (result && result.deletedAt) return undefined;
    return result;
  }
}

export const categoryRepository = new CategoryRepository();
