import { db } from "@/lib/db/database";
import { clearAllData } from "@/lib/db/seed";
import { runSync } from "./sync-engine";
import { ALL_DESCRIPTORS } from "./table-descriptors";

/**
 * Wipe this device's local data and disable sync. The cloud copy is untouched,
 * so re-enabling sync later (and choosing "Use cloud" in the wizard) restores
 * everything.
 */
export async function clearLocalAndDisableSync(
  userId: string | null,
  setSyncEnabled: (v: boolean) => void,
): Promise<void> {
  setSyncEnabled(false);
  if (userId) {
    await db.syncState.delete(userId);
  }
  await clearAllData();
}

/**
 * Soft-delete every active row across all synced tables, push the tombstones
 * to the cloud, and then hard-clear the local DB. After this returns, both
 * this device and the cloud are empty (other devices wipe on their next pull).
 *
 * Throws if the push fails — local rows remain tombstoned so a retry just
 * re-pushes them; idempotent.
 */
export async function clearAllDataEverywhere(userId: string): Promise<void> {
  const now = new Date();

  // 1. Tombstone every active row, bumping updatedAt so push picks them up.
  for (const d of ALL_DESCRIPTORS) {
    const table = db.table(d.localTable);
    await table.toCollection().modify((row: { deletedAt?: Date | null; updatedAt?: Date }) => {
      if (!row.deletedAt) {
        row.deletedAt = now;
        row.updatedAt = now;
      }
    });
  }

  // 2. Push tombstones to cloud. Throw on any push error.
  const result = await runSync(userId);
  if (result.errors.length > 0) {
    throw new Error(result.errors[0]);
  }

  // 3. Hard-clear local now that cloud reflects the deletions.
  await clearAllData();

  // 4. Move pull HWMs forward so we don't try to pull the tombstones back.
  const nowIso = now.toISOString();
  const lastPullAtByTable: Record<string, string | null> = {};
  for (const d of ALL_DESCRIPTORS) {
    lastPullAtByTable[d.name] = nowIso;
  }
  await db.syncState.update(userId, {
    lastPullAt: now,
    lastPullAtByTable,
  });
}
