import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { InternalTransfer } from "@/lib/types";

class InternalTransferRepository extends BaseRepository<InternalTransfer> {
  constructor() {
    super(db.internalTransfers);
  }

  async getAllSorted(): Promise<InternalTransfer[]> {
    const all = await this.getAll();
    return all.sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getByAccountRef(type: "account" | "wealthAccount", id: string): Promise<InternalTransfer[]> {
    const all = await this.getAllSorted();
    return all.filter(
      (t) => (t.fromType === type && t.fromId === id) || (t.toType === type && t.toId === id)
    );
  }
}

export const internalTransferRepository = new InternalTransferRepository();
