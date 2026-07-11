"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  getWealthOverviewSummary,
  getWealthActivityFeed,
  getWealthGrowthSeries,
  type WealthOverviewSummary,
  type WealthActivityFilter,
  type WealthActivityItem,
  type WealthGrowthPoint,
} from "@/lib/services/wealth-net-worth.service";

const defaultSummary: WealthOverviewSummary = {
  totalWealth: 0,
  emergencyReserves: 0,
  savingsAndYield: 0,
  investments: 0,
  totalContributions: 0,
  totalGrowth: 0,
  estimatedAnnualYield: 0,
  growthThisYear: 0,
  allocation: [],
  accountCount: 0,
};

export function useWealthOverviewSummary(): WealthOverviewSummary {
  return useLiveQuery(() => getWealthOverviewSummary(), [], defaultSummary);
}

export function useWealthActivityFeed(filter: WealthActivityFilter = {}): WealthActivityItem[] {
  return useLiveQuery(
    () => getWealthActivityFeed(filter),
    [filter.from, filter.to, filter.wealthAccountId, JSON.stringify(filter.kinds)],
    []
  );
}

export function useWealthGrowthSeries(monthsBack = 6): WealthGrowthPoint[] {
  return useLiveQuery(() => getWealthGrowthSeries(monthsBack), [monthsBack], []);
}
