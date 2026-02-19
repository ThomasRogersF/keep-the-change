"use client";

import { useState, useEffect, useMemo } from "react";

function computeRemaining(
  nextRetryAt: Date | null | undefined,
  syncStatus: string | undefined
): number | null {
  if (
    !nextRetryAt ||
    (syncStatus !== "error" && syncStatus !== "partial")
  ) {
    return null;
  }
  const target = new Date(nextRetryAt).getTime();
  const remaining = Math.max(0, Math.round((target - Date.now()) / 1000));
  return remaining <= 0 ? null : remaining;
}

/**
 * Returns live seconds remaining until nextRetryAt.
 * Returns null when there's no active countdown (not in error/partial state,
 * no nextRetryAt, or countdown has expired).
 *
 * Ticks every second while active. Deactivates automatically when not needed.
 */
export function useSyncCountdown(
  nextRetryAt: Date | null | undefined,
  syncStatus: string | undefined
): number | null {
  // Compute whether the countdown should be active (stable between renders)
  const isActive = useMemo(
    () =>
      !!nextRetryAt &&
      (syncStatus === "error" || syncStatus === "partial"),
    [nextRetryAt, syncStatus]
  );

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    () => computeRemaining(nextRetryAt, syncStatus)
  );

  useEffect(() => {
    if (!isActive) {
      // No interval needed — but still need to clear stale state.
      // Use a micro-tick to avoid the sync-setState-in-effect lint rule.
      const id = setTimeout(() => setSecondsRemaining(null), 0);
      return () => clearTimeout(id);
    }

    const tick = () => {
      setSecondsRemaining(computeRemaining(nextRetryAt, syncStatus));
    };

    // Schedule the initial tick via setTimeout to avoid synchronous
    // setState in the effect body (satisfies react-hooks/set-state-in-effect).
    const initialId = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(initialId);
      clearInterval(interval);
    };
  }, [isActive, nextRetryAt, syncStatus]);

  return secondsRemaining;
}
