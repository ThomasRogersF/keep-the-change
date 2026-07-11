"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { yieldProfileRepository } from "@/lib/db/repositories/yield-profile.repository";
import { yieldRateHistoryRepository } from "@/lib/db/repositories/yield-rate-history.repository";
import { getYieldSummary, type YieldSummary } from "@/lib/services/yield-profile.service";
import type { YieldProfile, YieldRateHistory } from "@/lib/types";

export function useYieldProfile(wealthAccountId: string | undefined): YieldProfile | undefined {
  return useLiveQuery(
    () =>
      wealthAccountId
        ? yieldProfileRepository.getByWealthAccountId(wealthAccountId)
        : Promise.resolve(undefined),
    [wealthAccountId],
    undefined
  );
}

export function useYieldSummary(wealthAccountId: string | undefined): YieldSummary | undefined {
  return useLiveQuery(
    () => (wealthAccountId ? getYieldSummary(wealthAccountId) : Promise.resolve(undefined)),
    [wealthAccountId],
    undefined
  );
}

export function useYieldRateHistory(profileId: string | undefined): YieldRateHistory[] {
  return useLiveQuery(
    () => (profileId ? yieldRateHistoryRepository.getByProfileId(profileId) : Promise.resolve([])),
    [profileId],
    []
  );
}
