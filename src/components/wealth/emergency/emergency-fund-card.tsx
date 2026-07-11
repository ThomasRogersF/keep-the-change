"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
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
    <Link
      href={`/wealth/emergency/${fund.id}`}
      className="block rounded-xl border bg-card p-5 space-y-4 transition-colors hover:border-primary/20"
    >
      <div className="flex items-center gap-4">
        <EmergencyProgressRing percent={progressPercent} size={72} strokeWidth={6} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <h3 className="font-semibold text-sm truncate">{fund.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {monthsCovered.toFixed(1)} months of expenses covered
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm pt-3 border-t">
        <span className="font-medium tabular-nums">{fmt(currentBalance)}</span>
        <span className="text-muted-foreground tabular-nums">of {fmt(targetAmount)}</span>
      </div>
    </Link>
  );
}
