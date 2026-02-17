import { db } from "@/lib/db/database";
import { supabase } from "@/lib/supabase/client";
import type { SyncState, SyncLogEntry, SyncSummary } from "@/lib/types";
import type { SyncResult, TableSyncResult, TableDescriptor, RemoteRow } from "./types";
import { ALL_DESCRIPTORS } from "./table-descriptors";

const CHUNK_SIZE = 200;
const LOG_BUFFER_SIZE = 200;

// ─── Module-level sync mutex ────────────────────────────────────────────────
let inFlight: Promise<SyncResult> | null = null;
let queued = false;

/** Returns true when a sync is currently in-flight */
export function isSyncInFlight(): boolean {
  return inFlight !== null;
}

/** Returns true when a sync has been queued behind the in-flight one */
export function isSyncQueued(): boolean {
  return queued;
}

/**
 * Public entry point — all callers (hook, settings, wizard) MUST use this.
 * - If no sync is running: starts one and returns its promise.
 * - If a sync IS running: marks queued=true and returns the in-flight promise
 *   (so callers get the same result without starting a second sync).
 * - When the in-flight sync finishes and queued===true: starts exactly one more.
 */
export async function runSync(userId: string): Promise<SyncResult> {
  if (inFlight) {
    queued = true;
    return inFlight;
  }

  const execute = async (): Promise<SyncResult> => {
    const engine = new SyncEngine(userId);
    try {
      return await engine.sync();
    } finally {
      inFlight = null;
      if (queued) {
        queued = false;
        inFlight = execute();
      }
    }
  };

  inFlight = execute();
  return inFlight;
}

// ─── Device ID ───────────────────────────────────────────────────────────────
function generateDeviceId(): string {
  const stored =
    typeof window !== "undefined"
      ? localStorage.getItem("ledgerly-device-id")
      : null;
  if (stored) return stored;
  const id = crypto.randomUUID();
  if (typeof window !== "undefined") {
    localStorage.setItem("ledgerly-device-id", id);
  }
  return id;
}

// ─── SyncEngine ──────────────────────────────────────────────────────────────
export class SyncEngine {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getOrCreateSyncState(): Promise<SyncState> {
    const existing = await db.syncState.get(this.userId);

    if (existing) {
      // Back-fill new per-table HWM fields if missing (migration from v1).
      const needsBackfill =
        !existing.lastPushAtByTable || !existing.lastPullAtByTable;
      if (needsBackfill) {
        const legacyPush = existing.lastPushAt
          ? existing.lastPushAt.toISOString()
          : null;
        const legacyPull = existing.lastPullAt
          ? existing.lastPullAt.toISOString()
          : null;
        const lastPushAtByTable: Record<string, string | null> = {};
        const lastPullAtByTable: Record<string, string | null> = {};
        for (const d of ALL_DESCRIPTORS) {
          lastPushAtByTable[d.name] = legacyPush;
          lastPullAtByTable[d.name] = legacyPull;
        }
        const patch: Partial<SyncState> = {
          lastPushAtByTable,
          lastPullAtByTable,
          lastSyncSummary: existing.lastSyncSummary ?? null,
          retryCount: existing.retryCount ?? 0,
          nextRetryAt: existing.nextRetryAt ?? null,
        };
        await db.syncState.update(this.userId, patch);
        return { ...existing, ...patch } as SyncState;
      }
      return existing;
    }

    // Brand-new state
    const emptyByTable: Record<string, string | null> = {};
    for (const d of ALL_DESCRIPTORS) {
      emptyByTable[d.name] = null;
    }
    const state: SyncState = {
      userId: this.userId,
      deviceId: generateDeviceId(),
      initialSyncCompleted: false,
      lastPushAt: null,
      lastPullAt: null,
      lastPushAtByTable: { ...emptyByTable },
      lastPullAtByTable: { ...emptyByTable },
      lastSyncAt: null,
      lastSyncStatus: "idle",
      lastSyncError: null,
      lastSyncSummary: null,
      retryCount: 0,
      nextRetryAt: null,
      syncLog: [],
    };
    await db.syncState.put(state);
    return state;
  }

  async sync(): Promise<SyncResult> {
    const state = await this.getOrCreateSyncState();
    const syncStartedAt = new Date();

    const result: SyncResult = {
      pushed: 0,
      pulled: 0,
      conflicts: 0,
      errors: [],
      tables: {},
    };

    // Initialize per-table result map
    for (const d of ALL_DESCRIPTORS) {
      result.tables[d.name] = { pushed: 0, pulled: 0, conflicts: 0 };
    }

    const log: SyncLogEntry[] = [...state.syncLog];

    // Working copies of per-table HWMs — only updated for successful tables
    const pushAtByTable: Record<string, string | null> = {
      ...(state.lastPushAtByTable ?? {}),
    };
    const pullAtByTable: Record<string, string | null> = {
      ...(state.lastPullAtByTable ?? {}),
    };

    // Mark as syncing
    await db.syncState.update(this.userId, { lastSyncStatus: "syncing" });

    let successfulTables = 0;
    let failedTables = 0;

    try {
      // ── PUSH ─────────────────────────────────────────────────────────────
      for (const descriptor of ALL_DESCRIPTORS) {
        const tableHWM = pushAtByTable[descriptor.name] ?? null;
        const lastPushAt = tableHWM ? new Date(tableHWM) : null;
        try {
          const pushed = await this.pushTable(descriptor, lastPushAt);
          result.tables[descriptor.name].pushed = pushed;
          result.pushed += pushed;
          // Mark this table's HWM on success
          pushAtByTable[descriptor.name] = syncStartedAt.toISOString();
          if (pushed > 0) {
            log.push({
              timestamp: new Date(),
              level: "info",
              action: "push",
              table: descriptor.name,
              count: pushed,
            });
          }
        } catch (err) {
          const msg = `Push ${descriptor.name}: ${
            err instanceof Error ? err.message : String(err)
          }`;
          result.errors.push(msg);
          result.tables[descriptor.name].error = msg;
          failedTables++;
          log.push({
            timestamp: new Date(),
            level: "error",
            action: "error",
            table: descriptor.name,
            count: 0,
            message: msg,
          });
        }
      }

      // ── PULL ─────────────────────────────────────────────────────────────
      for (const descriptor of ALL_DESCRIPTORS) {
        const tableHWM = pullAtByTable[descriptor.name] ?? null;
        const lastPullAt = tableHWM ? new Date(tableHWM) : null;
        try {
          const { pulled, conflicts } = await this.pullTable(
            descriptor,
            lastPullAt
          );
          result.tables[descriptor.name].pulled = pulled;
          result.tables[descriptor.name].conflicts = conflicts;
          result.pulled += pulled;
          result.conflicts += conflicts;
          // Mark this table's HWM on success
          pullAtByTable[descriptor.name] = syncStartedAt.toISOString();
          successfulTables++;
          if (pulled > 0) {
            log.push({
              timestamp: new Date(),
              level: "info",
              action: "pull",
              table: descriptor.name,
              count: pulled,
            });
          }
          if (conflicts > 0) {
            log.push({
              timestamp: new Date(),
              level: "warn",
              action: "conflict",
              table: descriptor.name,
              count: conflicts,
              message: `${conflicts} conflict(s) resolved (remote wins)`,
            });
          }
        } catch (err) {
          const msg = `Pull ${descriptor.name}: ${
            err instanceof Error ? err.message : String(err)
          }`;
          result.errors.push(msg);
          if (!result.tables[descriptor.name].error) {
            result.tables[descriptor.name].error = msg;
          }
          failedTables++;
          log.push({
            timestamp: new Date(),
            level: "error",
            action: "error",
            table: descriptor.name,
            count: 0,
            message: msg,
          });
        }
      }

      const finishedAt = new Date();
      const trimmedLog = log.slice(-LOG_BUFFER_SIZE);

      // Determine status
      const allFailed =
        failedTables === ALL_DESCRIPTORS.length && successfulTables === 0;
      const someFailed = failedTables > 0 && !allFailed;
      const status: SyncState["lastSyncStatus"] = allFailed
        ? "error"
        : someFailed
        ? "partial"
        : "success";

      // Build summary
      const summaryTables: SyncSummary["tables"] = {};
      for (const d of ALL_DESCRIPTORS) {
        const t = result.tables[d.name];
        summaryTables[d.name] = {
          pushed: t.pushed,
          pulled: t.pulled,
          conflictsResolved: t.conflicts,
          error: t.error,
        };
      }
      const lastSyncSummary: SyncSummary = {
        startedAt: syncStartedAt,
        finishedAt,
        durationMs: finishedAt.getTime() - syncStartedAt.getTime(),
        status:
          status === "success" ? "ok" : status === "partial" ? "partial" : "error",
        tables: summaryTables,
        totalPushed: result.pushed,
        totalPulled: result.pulled,
      };

      await db.syncState.update(this.userId, {
        lastPushAtByTable: pushAtByTable,
        lastPullAtByTable: pullAtByTable,
        lastSyncAt: finishedAt,
        lastSyncStatus: status,
        lastSyncError:
          result.errors.length > 0 ? result.errors.join("; ") : null,
        lastSyncSummary,
        syncLog: trimmedLog,
      });

      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const finishedAt = new Date();
      log.push({
        timestamp: finishedAt,
        level: "error",
        action: "error",
        table: "sync",
        count: 0,
        message: msg,
      });
      await db.syncState.update(this.userId, {
        lastPushAtByTable: pushAtByTable,
        lastPullAtByTable: pullAtByTable,
        lastSyncStatus: "error",
        lastSyncError: msg,
        lastSyncAt: finishedAt,
        syncLog: log.slice(-LOG_BUFFER_SIZE),
      });
      result.errors.push(msg);
      return result;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async pushTable(
    descriptor: TableDescriptor<any>,
    lastPushAt: Date | null
  ): Promise<number> {
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
      const remoteRows = chunk.map((row: unknown) =>
        descriptor.toRemote(row, this.userId)
      );

      const { error } = await supabase
        .from(descriptor.remoteTable)
        .upsert(remoteRows, { onConflict: "id" });

      if (error) {
        throw new Error(
          `Supabase upsert error on ${descriptor.remoteTable}: ${error.message}`
        );
      }
      pushed += chunk.length;
    }

    return pushed;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async pullTable(
    descriptor: TableDescriptor<any>,
    lastPullAt: Date | null
  ): Promise<{ pulled: number; conflicts: number }> {
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
        throw new Error(
          `Supabase select error on ${descriptor.remoteTable}: ${error.message}`
        );
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
