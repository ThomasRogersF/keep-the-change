"use client";

import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useHoldingSummary } from "@/lib/hooks/use-investments";
import { cn } from "@/lib/utils";
import type { AssetHolding } from "@/lib/types";

interface InvestmentHoldingCardProps {
  holding: AssetHolding;
}

export function InvestmentHoldingCard({ holding }: InvestmentHoldingCardProps) {
  const fmt = useCurrencyFormatter();
  const summary = useHoldingSummary(holding.id);
  const gain = summary?.unrealizedGain ?? 0;
  const gainPercent = summary?.unrealizedGainPercent ?? 0;
  const isPositive = gain >= 0;
  const avgCost = holding.quantity > 0 ? holding.costBasisTotal / holding.quantity : 0;

  return (
    <Link
      href={`/wealth/investments/${holding.id}`}
      className="block rounded-xl border bg-card p-4 space-y-2 transition-colors hover:border-primary/20"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{holding.symbol}</p>
          {holding.name && <p className="text-xs text-muted-foreground truncate">{holding.name}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium tabular-nums">{fmt(summary?.currentValue ?? 0)}</p>
          <p
            className={cn(
              "text-xs flex items-center gap-1 justify-end tabular-nums",
              isPositive ? "text-success" : "text-destructive"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-3 h-3" aria-hidden="true" />
            )}
            {isPositive ? "+" : ""}
            {fmt(gain)} ({gainPercent.toFixed(1)}%)
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {holding.quantity} units · avg cost {fmt(avgCost)}
      </p>
    </Link>
  );
}
