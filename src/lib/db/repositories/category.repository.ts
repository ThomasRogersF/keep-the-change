import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { Category } from "@/lib/types";

class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super(db.categories);
  }

  async getByName(name: string): Promise<Category | undefined> {
    return this.table.where("name").equals(name).first();
  }
}

export const categoryRepository = new CategoryRepository();
