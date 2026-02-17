import { db } from "../database";
import { BaseRepository } from "./base.repository";
import type { Subscription } from "@/lib/types";

class SubscriptionRepository extends BaseRepository<Subscription> {
  constructor() {
    super(db.subscriptions);
  }

  async getActive(): Promise<Subscription[]> {
    const results = await this.table.where("active").equals(1).toArray();
    return results.filter((s: Subscription) => !s.deletedAt);
  }

  async getUpcoming(from: Date, to: Date): Promise<Subscription[]> {
    return this.table
      .where("nextRenewalDate")
      .between(from, to, true, true)
      .filter((s: Subscription) => !s.deletedAt && s.active)
      .sortBy("nextRenewalDate");
  }

  async toggleActive(id: string): Promise<void> {
    const sub = await this.getById(id);
    if (sub) {
      await this.update(id, { active: !sub.active });
    }
  }
}

export const subscriptionRepository = new SubscriptionRepository();
