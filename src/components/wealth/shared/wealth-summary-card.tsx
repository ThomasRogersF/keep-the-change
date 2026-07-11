"use client";

import { LineChart, PiggyBank, Landmark, Percent, Shield, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import type { WealthOverviewSummary } from "@/lib/services/wealth-net-worth.service";

interface WealthSummaryCardProps {
  summary: WealthOverviewSummary;
}

export function WealthSummaryCard({ summary }: WealthSummaryCardProps) {
  const fmt = useCurrencyFormatter();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Wealth" value={fmt(summary.totalWealth)} icon={Wallet} trend="up" />
      <StatCard title="Emergency Reserves" value={fmt(summary.emergencyReserves)} icon={Shield} />
      <StatCard title="Savings & Yield" value={fmt(summary.savingsAndYield)} icon={Landmark} />
      <StatCard title="Investments" value={fmt(summary.investments)} icon={LineChart} />
      <StatCard title="Total Contributions" value={fmt(summary.totalContributions)} icon={PiggyBank} />
      <StatCard
        title="Total Growth"
        value={fmt(summary.totalGrowth)}
        icon={TrendingUp}
        trend={summary.totalGrowth >= 0 ? "up" : "down"}
      />
      <StatCard title="Est. Annual Yield" value={fmt(summary.estimatedAnnualYield)} icon={Percent} />
      <StatCard
        title="Growth This Year"
        value={fmt(summary.growthThisYear)}
        icon={Sparkles}
        trend={summary.growthThisYear >= 0 ? "up" : "down"}
      />
    </div>
  );
}
