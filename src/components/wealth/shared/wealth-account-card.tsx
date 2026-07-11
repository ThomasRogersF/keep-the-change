"use client";

import Link from "next/link";
import { Landmark, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useYieldSummary } from "@/lib/hooks/use-savings";
import { usePortfolioSummary } from "@/lib/hooks/use-investments";
import { RiskBadge } from "./risk-badge";
import { LiquidityBadge } from "./liquidity-badge";
import type { WealthAccount } from "@/lib/types";

interface WealthAccountCardProps {
  account: WealthAccount;
}

export function WealthAccountCard({ account }: WealthAccountCardProps) {
  const fmt = useCurrencyFormatter();
  const isBrokerage = account.type === "brokerage";
  const yieldSummary = useYieldSummary(isBrokerage ? undefined : account.id);
  const portfolioSummary = usePortfolioSummary(isBrokerage ? account.id : undefined);

  const currentValue = isBrokerage ? account.balance + portfolioSummary.totalValue : account.balance;
  const href = isBrokerage ? "/wealth/investments" : `/wealth/savings/${account.id}`;

  return (
    <Link
      href={href}
      className="block rounded-xl border bg-card p-5 space-y-3 transition-colors hover:border-primary/20"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
          {isBrokerage ? <LineChart className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate">{account.name}</h3>
          {account.institution && (
            <p className="text-xs text-muted-foreground truncate">{account.institution}</p>
          )}
        </div>
      </div>

      <p className="text-xl font-semibold tabular-nums">{fmt(currentValue)}</p>

      {isBrokerage ? (
        <p
          className={cn(
            "text-xs tabular-nums",
            portfolioSummary.unrealizedGain >= 0 ? "text-success" : "text-destructive"
          )}
        >
          {portfolioSummary.unrealizedGain >= 0 ? "+" : ""}
          {fmt(portfolioSummary.unrealizedGain)} ({portfolioSummary.unrealizedGainPercent.toFixed(1)}%)
        </p>
      ) : yieldSummary ? (
        <p className="text-xs text-success tabular-nums">
          Est. {fmt(yieldSummary.estimatedAnnual)}/yr ({yieldSummary.profile.currentRate}%{" "}
          {yieldSummary.profile.rateType})
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">No yield configured</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <RiskBadge level={account.riskLevel} />
        <LiquidityBadge liquidity={account.liquidity} />
      </div>
    </Link>
  );
}
