"use client";

import { useCallback, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { db } from "@/lib/db/database";
import { useAuth } from "@/lib/auth/use-auth";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { runSync } from "./sync-engine";
import type { SyncState } from "@/lib/types";

// Backoff schedule in seconds: 10s, 30s, 1m, 2m, 5m
const BACKOFF_SECONDS = [10, 30, 60, 120, 300] as const;

function classifyError(errors: string[]): "auth" | "network" | "other" {
  const combined = errors.join(" ").toLowerCase();
  if (
    combined.includes("401") ||
    combined.includes("403") ||
    combined.includes("unauthorized") ||
    combined.includes("forbidden") ||
    combined.includes("jwt") ||
    combined.includes("session") ||
    combined.includes("not authenticated")
  ) {
    return "auth";
  }
  if (
    combined.includes("fetch") ||
    combined.includes("networkerror") ||
    combined.includes("failed to fetch") ||
    combined.includes("timeout") ||
    combined.includes("econnrefused") ||
    combined.includes("500") ||
    combined.includes("502") ||
    combined.includes("503") ||
    combined.includes("504")
  ) {
    return "network";
  }
  return "other";
}

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track if we've already shown the "back online" toast to avoid duplicates
  const wasOfflineRef = useRef(false);
  // Prevent concurrent sync calls from this hook instance
  const localSyncingRef = useRef(false);

  const syncNow = useCallback(async (): Promise<void> => {
    if (!user || !syncEnabled || localSyncingRef.current) return;

    // Check initial sync has been done
    const state = await db.syncState.get(user.id);
    if (!state?.initialSyncCompleted) return;

    // Check if we're in a backoff window (skip auto retries, not manual)
    if (state.nextRetryAt && new Date(state.nextRetryAt) > new Date()) {
      return;
    }

    localSyncingRef.current = true;
    try {
      const result = await runSync(user.id);

      if (result.errors.length === 0) {
        // Clear backoff on success
        await db.syncState.update(user.id, {
          retryCount: 0,
          nextRetryAt: null,
        });
      } else {
        const errorType = classifyError(result.errors);

        if (errorType === "auth") {
          // Auth errors: don't auto-retry, show persistent message via state
          await db.syncState.update(user.id, {
            retryCount: 0,
            nextRetryAt: null,
          });
        } else {
          // Network / other errors: apply exponential backoff
          const currentRetry = state.retryCount ?? 0;
          const nextRetry = Math.min(currentRetry, BACKOFF_SECONDS.length - 1);
          const delaySec = BACKOFF_SECONDS[nextRetry];
          const nextRetryAt = new Date(Date.now() + delaySec * 1000);
          await db.syncState.update(user.id, {
            retryCount: currentRetry + 1,
            nextRetryAt,
          });
        }
      }
    } finally {
      localSyncingRef.current = false;
    }
  }, [user, syncEnabled]);

  /**
   * Manual sync — ignores backoff window, resets retry count on call.
   * Returns the SyncResult so callers can show toasts.
   */
  const syncNowManual = useCallback(async () => {
    if (!user || !syncEnabled) return null;

    // Reset backoff so manual trigger always fires
    const state = await db.syncState.get(user.id);
    if (state) {
      await db.syncState.update(user.id, { nextRetryAt: null });
    }

    localSyncingRef.current = true;
    try {
      return await runSync(user.id);
    } finally {
      localSyncingRef.current = false;
    }
  }, [user, syncEnabled]);

  // Auto-sync on mount
  useEffect(() => {
    if (!user || !syncEnabled || !autoSyncEnabled) return;
    syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, syncEnabled, autoSyncEnabled]);

  // Online/offline handling
  useEffect(() => {
    if (!user || !syncEnabled || !autoSyncEnabled) return;

    const handleOffline = () => {
      wasOfflineRef.current = true;
    };

    const handleOnline = () => {
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        toast.success("Back online. Syncing…");
        // Reset backoff so the online trigger fires immediately
        db.syncState.get(user.id).then((state) => {
          if (state?.initialSyncCompleted) {
            db.syncState.update(user.id, { nextRetryAt: null }).then(() => {
              localSyncingRef.current = false;
              syncNow();
            });
          }
        });
      }
    };

    // Initialise offline tracking
    if (!navigator.onLine) {
      wasOfflineRef.current = true;
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [user, syncEnabled, autoSyncEnabled, syncNow]);

  // Auto-sync on 5-minute interval (respects backoff)
  useEffect(() => {
    if (!user || !syncEnabled || !autoSyncEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      syncNow();
    }, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, syncEnabled, autoSyncEnabled, syncNow]);

  return { syncNow, syncNowManual };
}
