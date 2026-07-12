"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { FintechCard } from "@/components/ui/fintech-card";
import { EmergencyProgressRing } from "./emergency-progress-ring";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import type { EmergencyFundSummary } from "@/lib/services/emergency-fund.service";

interface EmergencyFundCardProps {
  summary: EmergencyFundSummary;
}

export function EmergencyFundCard({ summary }: EmergencyFundCardProps) {
  const fmt = useCurrencyFormatter();
  const { fund, currentBalance, targetAmount, progressPercent, monthsCovered } = summary;

  return (
    <Link href={`/wealth/emergency/${fund.id}`} className="block group">
      <FintechCard className="p-5 space-y-4 hover:border-finance-emergency/20 transition-all">
        <div className="flex items-center gap-4">
          <EmergencyProgressRing percent={progressPercent} size={72} strokeWidth={6} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-finance-emergency shrink-0" aria-hidden="true" />
              <h3 className="font-semibold text-sm truncate group-hover:text-finance-emergency transition-colors">
                {fund.name} Reserve
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {monthsCovered.toFixed(1)} months of expenses covered
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm pt-3 border-t">
          <span className="font-medium tabular-nums">{fmt(currentBalance)}</span>
          <span className="text-muted-foreground tabular-nums text-xs">Target: {fmt(targetAmount)}</span>
        </div>
      </FintechCard>
    </Link>
  );
}
