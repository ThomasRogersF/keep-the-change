"use client";

import { useCallback, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";
import { useAuth } from "@/lib/auth/use-auth";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { SyncEngine } from "./sync-engine";
import type { SyncState } from "@/lib/types";

export function useSyncState(): SyncState | undefined {
  const { user } = useAuth();
  return useLiveQuery(
    async () => {
      if (!user) return undefined;
      return db.syncState.get(user.id);
    },
    [user?.id],
    undefined
  );
}

export function useSync() {
  const { user } = useAuth();
  const { syncEnabled, autoSyncEnabled } = useSettingsStore();
  const syncingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncNow = useCallback(async () => {
    if (!user || !syncEnabled || syncingRef.current) return;
    syncingRef.current = true;
    try {
      const engine = new SyncEngine(user.id);
      await engine.sync();
    } finally {
      syncingRef.current = false;
    }
  }, [user, syncEnabled]);

  // Auto-sync on mount
  useEffect(() => {
    if (!user || !syncEnabled || !autoSyncEnabled) return;

    // Check if initial sync is completed before auto-syncing
    db.syncState.get(user.id).then((state) => {
      if (state?.initialSyncCompleted) {
        syncNow();
      }
    });
  }, [user, syncEnabled, autoSyncEnabled, syncNow]);

  // Auto-sync on coming online
  useEffect(() => {
    if (!user || !syncEnabled || !autoSyncEnabled) return;

    const handleOnline = () => {
      db.syncState.get(user.id).then((state) => {
        if (state?.initialSyncCompleted) {
          syncNow();
        }
      });
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [user, syncEnabled, autoSyncEnabled, syncNow]);

  // Auto-sync on 5-minute interval
  useEffect(() => {
    if (!user || !syncEnabled || !autoSyncEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      db.syncState.get(user.id).then((state) => {
        if (state?.initialSyncCompleted) {
          syncNow();
        }
      });
    }, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, syncEnabled, autoSyncEnabled, syncNow]);

  return { syncNow };
}
