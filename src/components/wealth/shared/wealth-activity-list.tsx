"use client";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import type { WealthActivityItem, WealthActivityKind } from "@/lib/services/wealth-net-worth.service";

interface WealthActivityListProps {
  items: WealthActivityItem[];
  limit?: number;
  emptyMessage?: string;
}

const KIND_ICON: Record<WealthActivityKind, LucideIcon> = {
  emergency_contribution: ArrowDownLeft,
  emergency_withdrawal: ArrowUpRight,
  investment_buy: TrendingUp,
  investment_sell: TrendingDown,
  investment_dividend: DollarSign,
  investment_fee: DollarSign,
  investment_price_update: Percent,
  internal_transfer: ArrowLeftRight,
  yield_rate_change: Percent,
};

const POSITIVE_KINDS = new Set<WealthActivityKind>([
  "emergency_contribution",
  "investment_dividend",
  "investment_sell",
]);

const NO_AMOUNT_KINDS = new Set<WealthActivityKind>(["investment_price_update", "yield_rate_change"]);

export function WealthActivityList({
  items,
  limit,
  emptyMessage = "No activity yet",
}: WealthActivityListProps) {
  const fmt = useCurrencyFormatter();
  const visible = limit ? items.slice(0, limit) : items;

  if (visible.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-1">
      {visible.map((item) => {
        const Icon = KIND_ICON[item.kind];
        const isPositive = POSITIVE_KINDS.has(item.kind);
        const showAmount = !NO_AMOUNT_KINDS.has(item.kind);
        return (
          <div
            key={`${item.sourceTable}-${item.id}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors"
          >
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                isPositive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.label}</p>
              <p className="text-xs text-muted-foreground">
                {item.date}
                {item.detail && ` · ${item.detail}`}
              </p>
            </div>
            {showAmount && (
              <span
                className={cn(
                  "text-sm font-medium tabular-nums shrink-0",
                  isPositive ? "text-success" : "text-foreground"
                )}
              >
                {fmt(item.amount)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
