import { db } from "@/lib/db/database";
import { supabase } from "@/lib/supabase/client";
import { clearAllData } from "@/lib/db/seed";
import { SyncEngine } from "./sync-engine";
import { ALL_DESCRIPTORS } from "./table-descriptors";

export async function getLocalDataCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const descriptor of ALL_DESCRIPTORS) {
    const table = db.table(descriptor.localTable);
    counts[descriptor.name] = await table
      .filter((r: Record<string, unknown>) => !r.deletedAt)
      .count();
  }
  return counts;
}

export async function getRemoteDataCounts(userId: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const descriptor of ALL_DESCRIPTORS) {
    const { count, error } = await supabase
      .from(descriptor.remoteTable)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (error) {
      counts[descriptor.name] = 0;
    } else {
      counts[descriptor.name] = count ?? 0;
    }
  }
  return counts;
}

/** Push all local data to cloud, then pull any remote changes */
export async function initialSyncKeepLocal(userId: string): Promise<void> {
  const engine = new SyncEngine(userId);
  await engine.getOrCreateSyncState();

  // Push everything (lastPushAt=null triggers full push)
  await engine.sync();

  await db.syncState.update(userId, { initialSyncCompleted: true });
}

/** Clear local data, pull everything from cloud */
export async function initialSyncUseCloud(userId: string): Promise<void> {
  const engine = new SyncEngine(userId);
  await engine.getOrCreateSyncState();

  // Clear all local data
  await clearAllData();

  // Reset push timestamp so we don't push empty data
  await db.syncState.update(userId, {
    lastPushAt: new Date(),
    lastPullAt: null,
  });

  // Pull everything from cloud
  await engine.sync();

  await db.syncState.update(userId, { initialSyncCompleted: true });
}

/** Merge: run normal sync (push local + pull remote with conflict resolution) */
export async function initialSyncMerge(userId: string): Promise<void> {
  const engine = new SyncEngine(userId);
  await engine.getOrCreateSyncState();

  await engine.sync();

  await db.syncState.update(userId, { initialSyncCompleted: true });
}
