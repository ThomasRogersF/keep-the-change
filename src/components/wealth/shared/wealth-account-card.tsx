"use client";

import Link from "next/link";
import { Landmark, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { FintechCard } from "@/components/ui/fintech-card";
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
    <Link href={href} className="block group">
      <FintechCard variant="vault" className="p-5 space-y-4 hover:opacity-90 transition-opacity">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-finance-wealth-foreground shrink-0 border border-white/5">
            {isBrokerage ? <LineChart className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{account.name}</h3>
            {account.institution && (
              <p className="text-xs text-muted-foreground truncate">{account.institution}</p>
            )}
          </div>
        </div>

        <p className="text-xl font-semibold tabular-nums tracking-tight">{fmt(currentValue)}</p>

        {isBrokerage ? (
          <p
            className={cn(
              "text-xs tabular-nums font-medium",
              portfolioSummary.unrealizedGain >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {portfolioSummary.unrealizedGain >= 0 ? "+" : ""}
            {fmt(portfolioSummary.unrealizedGain)} ({portfolioSummary.unrealizedGainPercent.toFixed(1)}%)
          </p>
        ) : yieldSummary ? (
          <p className="text-xs text-success tabular-nums font-medium">
            Est. {fmt(yieldSummary.estimatedAnnual)}/yr ({yieldSummary.profile.currentRate}%{" "}
            {yieldSummary.profile.rateType})
          </p>
        ) : (
          <p className="text-xs opacity-60">No yield configured</p>
        )}

        <div className="flex flex-wrap gap-2 mt-2">
          <RiskBadge level={account.riskLevel} />
          <LiquidityBadge liquidity={account.liquidity} />
        </div>
      </FintechCard>
    </Link>
  );
}
