"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";
import { emergencyFundActivityRepository } from "@/lib/db/repositories/emergency-fund-activity.repository";
import {
  getEmergencyFundSummary,
  getAllEmergencyFundsSummary,
  type EmergencyFundSummary,
} from "@/lib/services/emergency-fund.service";
import type { EmergencyFund, EmergencyFundActivity } from "@/lib/types";

export function useEmergencyFunds(): EmergencyFund[] | undefined {
  return useLiveQuery(
    async () => (await db.emergencyFunds.toArray()).filter((f) => !f.deletedAt),
    [],
    undefined
  );
}

export function useEmergencyFund(id: string | undefined): EmergencyFund | undefined {
  return useLiveQuery(
    async () => {
      if (!id) return undefined;
      const fund = await db.emergencyFunds.get(id);
      if (fund && fund.deletedAt) return undefined;
      return fund;
    },
    [id],
    undefined
  );
}

export function useEmergencyFundActivities(fundId: string | undefined): EmergencyFundActivity[] {
  return useLiveQuery(
    () => (fundId ? emergencyFundActivityRepository.getByFundId(fundId) : Promise.resolve([])),
    [fundId],
    []
  );
}

export function useEmergencyFundSummary(fundId: string | undefined): EmergencyFundSummary | undefined {
  return useLiveQuery(
    () => (fundId ? getEmergencyFundSummary(fundId) : Promise.resolve(undefined)),
    [fundId],
    undefined
  );
}

export function useAllEmergencyFundsSummary(): EmergencyFundSummary[] | undefined {
  return useLiveQuery(() => getAllEmergencyFundsSummary(), [], undefined);
}
