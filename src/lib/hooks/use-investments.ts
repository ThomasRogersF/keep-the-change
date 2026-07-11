"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { assetHoldingRepository } from "@/lib/db/repositories/asset-holding.repository";
import { investmentActivityRepository } from "@/lib/db/repositories/investment-activity.repository";
import {
  getHoldingSummary,
  getPortfolioSummary,
  type HoldingSummary,
  type PortfolioSummary,
} from "@/lib/services/investment.service";
import type { AssetHolding, InvestmentActivity } from "@/lib/types";

export function useAssetHoldings(wealthAccountId?: string): AssetHolding[] | undefined {
  return useLiveQuery(
    () =>
      wealthAccountId
        ? assetHoldingRepository.getByWealthAccountId(wealthAccountId)
        : assetHoldingRepository.getAll(),
    [wealthAccountId],
    undefined
  );
}

export function useAssetHolding(id: string | undefined): AssetHolding | undefined {
  return useLiveQuery(
    () => (id ? assetHoldingRepository.getById(id) : Promise.resolve(undefined)),
    [id],
    undefined
  );
}

export function useInvestmentActivities(holdingId: string | undefined): InvestmentActivity[] {
  return useLiveQuery(
    () => (holdingId ? investmentActivityRepository.getByHoldingId(holdingId) : Promise.resolve([])),
    [holdingId],
    []
  );
}

export function useHoldingSummary(holdingId: string | undefined): HoldingSummary | undefined {
  return useLiveQuery(
    () => (holdingId ? getHoldingSummary(holdingId) : Promise.resolve(undefined)),
    [holdingId],
    undefined
  );
}

const defaultPortfolioSummary: PortfolioSummary = {
  totalValue: 0,
  totalCostBasis: 0,
  unrealizedGain: 0,
  unrealizedGainPercent: 0,
  realizedGain: 0,
  dividendsReceived: 0,
  feesTotal: 0,
  allocation: [],
  holdingsCount: 0,
};

export function usePortfolioSummary(wealthAccountId?: string): PortfolioSummary {
  return useLiveQuery(
    () => getPortfolioSummary(wealthAccountId),
    [wealthAccountId],
    defaultPortfolioSummary
  );
}
