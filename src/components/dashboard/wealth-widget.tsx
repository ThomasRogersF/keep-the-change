"use client";

import Link from "next/link";
import { ArrowRight, Percent, Shield, Wallet } from "lucide-react";
import { FintechCard } from "@/components/ui/fintech-card";
import { useWealthOverviewSummary } from "@/lib/hooks/use-wealth-overview";
import { useAllEmergencyFundsSummary } from "@/lib/hooks/use-emergency-funds";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useSettingsStore } from "@/lib/stores/settings.store";

export function WealthWidget() {
  const showWidget = useSettingsStore((s) => s.showWealthWidgetOnDashboard);
  const summary = useWealthOverviewSummary();
  const emergencyFunds = useAllEmergencyFundsSummary() ?? [];
  const fmt = useCurrencyFormatter();

  if (!showWidget || summary.accountCount === 0) return null;

  const avgEmergencyProgress =
    emergencyFunds.length > 0
      ? emergencyFunds.reduce((s, f) => s + f.progressPercent, 0) / emergencyFunds.length
      : null;

  return (
    <Link href="/wealth" className="block">
      <FintechCard variant="vault" className="transition-all hover:opacity-95">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-finance-wealth-foreground shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Wealth</p>
                <p className="text-xs opacity-70">{fmt(summary.totalWealth)} total</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-70" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {avgEmergencyProgress !== null && (
              <div className="flex items-center gap-1.5 opacity-80">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {Math.round(avgEmergencyProgress)}% emergency
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 opacity-80">
              <span className="truncate">
                {fmt(summary.investments)} invested
              </span>
            </div>
            <div className="flex items-center gap-1.5 opacity-80">
              <Percent className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {fmt(summary.estimatedAnnualYield)}/yr est.
              </span>
            </div>
          </div>
        </div>
      </FintechCard>
    </Link>
  );
}
