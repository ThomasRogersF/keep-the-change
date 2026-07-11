"use client";

import Link from "next/link";
import { Landmark } from "lucide-react";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useYieldSummary } from "@/lib/hooks/use-savings";
import { YieldRateBadge } from "./yield-rate-badge";
import { RiskBadge } from "@/components/wealth/shared/risk-badge";
import { LiquidityBadge } from "@/components/wealth/shared/liquidity-badge";
import { InsuranceBadge } from "@/components/wealth/shared/insurance-badge";
import type { WealthAccount } from "@/lib/types";

interface YieldAccountCardProps {
  account: WealthAccount;
}

export function YieldAccountCard({ account }: YieldAccountCardProps) {
  const fmt = useCurrencyFormatter();
  const summary = useYieldSummary(account.id);
  const isDigitalAsset = account.assetClass === "crypto";

  return (
    <Link
      href={`/wealth/savings/${account.id}`}
      className="block rounded-xl border bg-card p-5 space-y-3 transition-colors hover:border-primary/20"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{account.name}</h3>
            {account.institution && (
              <p className="text-xs text-muted-foreground truncate">{account.institution}</p>
            )}
          </div>
        </div>
        {summary && <YieldRateBadge rate={summary.profile.currentRate} rateType={summary.profile.rateType} />}
      </div>

      <p className="text-xl font-semibold tabular-nums">{fmt(account.balance)}</p>

      {summary ? (
        <p className="text-xs text-muted-foreground">
          Est. monthly: <span className="text-foreground font-medium">{fmt(summary.estimatedMonthly)}</span>{" "}
          · Est. annual: <span className="text-foreground font-medium">{fmt(summary.estimatedAnnual)}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">No yield configured</p>
      )}

      {isDigitalAsset && (
        <p className="text-[11px] text-muted-foreground">Digital asset product</p>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        <RiskBadge level={account.riskLevel} />
        <LiquidityBadge liquidity={account.liquidity} />
        <InsuranceBadge insuranceType={account.insuranceType} isDigitalAsset={isDigitalAsset} />
      </div>
    </Link>
  );
}
