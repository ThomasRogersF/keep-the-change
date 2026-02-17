import { db } from "@/lib/db/database";
import { supabase } from "@/lib/supabase/client";
import type { SyncState, SyncLogEntry } from "@/lib/types";
import type { SyncResult, TableDescriptor, RemoteRow } from "./types";
import { ALL_DESCRIPTORS } from "./table-descriptors";

const CHUNK_SIZE = 200;

function generateDeviceId(): string {
  const stored = typeof window !== "undefined" ? localStorage.getItem("ledgerly-device-id") : null;
  if (stored) return stored;
  const id = crypto.randomUUID();
  if (typeof window !== "undefined") {
    localStorage.setItem("ledgerly-device-id", id);
  }
  return id;
}

export class SyncEngine {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getOrCreateSyncState(): Promise<SyncState> {
    const existing = await db.syncState.get(this.userId);
    if (existing) return existing;

    const state: SyncState = {
      userId: this.userId,
      deviceId: generateDeviceId(),
      initialSyncCompleted: false,
      lastPushAt: null,
      lastPullAt: null,
      lastSyncAt: null,
      lastSyncStatus: "idle",
      lastSyncError: null,
      syncLog: [],
    };
    await db.syncState.put(state);
    return state;
  }

  async sync(): Promise<SyncResult> {
    const state = await this.getOrCreateSyncState();
    const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] };
    const log: SyncLogEntry[] = [...state.syncLog];

    // Mark as syncing
    await db.syncState.update(this.userId, { lastSyncStatus: "syncing" });

    try {
      // ── PUSH ──
      const pushStartedAt = new Date();
      for (const descriptor of ALL_DESCRIPTORS) {
        try {
          const pushed = await this.pushTable(descriptor, state.lastPushAt);
          result.pushed += pushed;
          if (pushed > 0) {
            log.push({
              timestamp: new Date(),
              action: "push",
              table: descriptor.name,
              count: pushed,
            });
          }
        } catch (err) {
          const msg = `Push ${descriptor.name}: ${err instanceof Error ? err.message : String(err)}`;
          result.errors.push(msg);
          log.push({
            timestamp: new Date(),
            action: "error",
            table: descriptor.name,
            count: 0,
            message: msg,
          });
        }
      }

      // ── PULL ──
      const pullStartedAt = new Date();
      for (const descriptor of ALL_DESCRIPTORS) {
        try {
          const { pulled, conflicts } = await this.pullTable(descriptor, state.lastPullAt);
          result.pulled += pulled;
          result.conflicts += conflicts;
          if (pulled > 0) {
            log.push({
              timestamp: new Date(),
              action: "pull",
              table: descriptor.name,
              count: pulled,
            });
          }
          if (conflicts > 0) {
            log.push({
              timestamp: new Date(),
              action: "conflict",
              table: descriptor.name,
              count: conflicts,
              message: `${conflicts} conflicts resolved (remote wins)`,
            });
          }
        } catch (err) {
          const msg = `Pull ${descriptor.name}: ${err instanceof Error ? err.message : String(err)}`;
          result.errors.push(msg);
          log.push({
            timestamp: new Date(),
            action: "error",
            table: descriptor.name,
            count: 0,
            message: msg,
          });
        }
      }

      // Trim log to last 100 entries
      const trimmedLog = log.slice(-100);

      const status = result.errors.length > 0 ? "error" as const : "success" as const;
      await db.syncState.update(this.userId, {
        lastPushAt: pushStartedAt,
        lastPullAt: pullStartedAt,
        lastSyncAt: new Date(),
        lastSyncStatus: status,
        lastSyncError: result.errors.length > 0 ? result.errors.join("; ") : null,
        syncLog: trimmedLog,
      });

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await db.syncState.update(this.userId, {
        lastSyncStatus: "error",
        lastSyncError: msg,
        lastSyncAt: new Date(),
      });
      result.errors.push(msg);
      return result;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async pushTable(descriptor: TableDescriptor<any>, lastPushAt: Date | null): Promise<number> {
    const table = db.table(descriptor.localTable);
    let rows;

    if (lastPushAt) {
      rows = await table.where("updatedAt").above(lastPushAt).toArray();
    } else {
      rows = await table.toArray();
    }

    if (rows.length === 0) return 0;

    let pushed = 0;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const remoteRows = chunk.map((row: unknown) => descriptor.toRemote(row, this.userId));

      const { error } = await supabase
        .from(descriptor.remoteTable)
        .upsert(remoteRows, { onConflict: "id" });

      if (error) {
        throw new Error(`Supabase upsert error on ${descriptor.remoteTable}: ${error.message}`);
      }
      pushed += chunk.length;
    }

    return pushed;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async pullTable(descriptor: TableDescriptor<any>, lastPullAt: Date | null): Promise<{ pulled: number; conflicts: number }> {
    let query = supabase
      .from(descriptor.remoteTable)
      .select("*")
      .eq("user_id", this.userId);

    if (lastPullAt) {
      query = query.gt("updated_at", lastPullAt.toISOString());
    }

    // Paginate through results
    const allRemoteRows: RemoteRow[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await query.range(from, from + pageSize - 1);
      if (error) {
        throw new Error(`Supabase select error on ${descriptor.remoteTable}: ${error.message}`);
      }
      if (data && data.length > 0) {
        allRemoteRows.push(...(data as RemoteRow[]));
        from += data.length;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    if (allRemoteRows.length === 0) return { pulled: 0, conflicts: 0 };

    const table = db.table(descriptor.localTable);
    let pulled = 0;
    let conflicts = 0;

    for (const remoteRow of allRemoteRows) {
      const localRow = descriptor.toLocal(remoteRow);
      const localId = (localRow as { id: string }).id;
      const existing = await table.get(localId);

      if (!existing) {
        // New record from remote
        await table.put(localRow);
        pulled++;
      } else {
        // Conflict resolution: remote updatedAt > local updatedAt → remote wins
        const remoteUpdatedAt = new Date(remoteRow.updated_at as string);
        const localUpdatedAt = existing.updatedAt as Date;

        if (remoteUpdatedAt > localUpdatedAt) {
          await table.put(localRow);
          pulled++;
          conflicts++;
        }
        // else: local is newer or same, skip
      }
    }

    return { pulled, conflicts };
  }
}
