"use client";

import Link from "next/link";
import { ArrowRight, Percent, Shield, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card className="transition-colors hover:border-primary/20">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Wealth</p>
                <p className="text-xs text-muted-foreground">{fmt(summary.totalWealth)} total</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {avgEmergencyProgress !== null && (
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">
                  {Math.round(avgEmergencyProgress)}% emergency
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground truncate">
                {fmt(summary.investments)} invested
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">
                {fmt(summary.estimatedAnnualYield)}/yr est.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
