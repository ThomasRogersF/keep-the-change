/**
 * Sync Health Diagnostics — checks RLS access, table counts, and exports
 * a safe diagnostics JSON. Deliberately excludes all secrets/tokens.
 */

import { supabase } from "@/lib/supabase/client";
import { db } from "@/lib/db/database";
import { ALL_DESCRIPTORS } from "./table-descriptors";
import { getTabId } from "./cross-tab-lock";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TableDiagnostics {
  localCount: number;
  remoteCount: number | null; // null if RLS check failed
  delta: number | null;
}

export interface SyncDiagnostics {
  timestamp: string;
  deviceId: string;
  tabId: string;
  online: boolean;
  supabaseReachable: boolean;
  rlsAccessible: boolean;
  tables: Record<string, TableDiagnostics>;
  syncState: {
    lastSyncStatus: string | null;
    lastSyncAt: string | null;
    retryCount: number;
    nextRetryAt: string | null;
    initialSyncCompleted: boolean;
    logEntryCount: number;
  } | null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Runs a comprehensive diagnostic check:
 * - Checks network + Supabase reachability
 * - Verifies RLS allows querying each table
 * - Compares local vs. remote row counts per table
 * - Includes sync state metadata (no secrets)
 */
export async function runSyncDiagnostics(
  userId: string
): Promise<SyncDiagnostics> {
  const deviceId = localStorage.getItem("ledgerly-device-id") ?? "unknown";

  // Check Supabase reachability + RLS access
  let supabaseReachable = false;
  let rlsAccessible = false;

  try {
    const { error } = await supabase
      .from("accounts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .limit(0);

    supabaseReachable = true;
    rlsAccessible = !error;
  } catch {
    // Network or other failure — supabaseReachable stays false
  }

  // Per-table local vs remote counts
  const tables: Record<string, TableDiagnostics> = {};

  for (const d of ALL_DESCRIPTORS) {
    const localTable = db.table(d.localTable);
    const localCount = await localTable.count();

    let remoteCount: number | null = null;
    try {
      const { count, error } = await supabase
        .from(d.remoteTable)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (!error) remoteCount = count ?? 0;
    } catch {
      // Leave remoteCount as null
    }

    tables[d.name] = {
      localCount,
      remoteCount,
      delta: remoteCount !== null ? localCount - remoteCount : null,
    };
  }

  // Sync state (safe subset — no tokens, no user email)
  const state = await db.syncState.get(userId);
  const syncStateSummary = state
    ? {
        lastSyncStatus: state.lastSyncStatus,
        lastSyncAt: state.lastSyncAt
          ? new Date(state.lastSyncAt).toISOString()
          : null,
        retryCount: state.retryCount,
        nextRetryAt: state.nextRetryAt
          ? new Date(state.nextRetryAt).toISOString()
          : null,
        initialSyncCompleted: state.initialSyncCompleted,
        logEntryCount: state.syncLog.length,
      }
    : null;

  return {
    timestamp: new Date().toISOString(),
    deviceId,
    tabId: getTabId(),
    online: navigator.onLine,
    supabaseReachable,
    rlsAccessible,
    tables,
    syncState: syncStateSummary,
  };
}

/**
 * Serializes diagnostics to a safe JSON string (no secrets/tokens).
 */
export function exportDiagnosticsJson(diagnostics: SyncDiagnostics): string {
  return JSON.stringify(diagnostics, null, 2);
}
