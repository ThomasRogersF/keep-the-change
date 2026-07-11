"use client";

import { ArrowDownLeft, ArrowUpRight, RefreshCw, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MonthSelector } from "@/components/income/month-selector";
import { StatCard } from "@/components/dashboard/stat-card";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { CategoryBreakdownChart } from "@/components/dashboard/category-breakdown-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { GoalsWidget } from "@/components/dashboard/goals-widget";
import { WealthWidget } from "@/components/dashboard/wealth-widget";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const selectedMonth = useSettingsStore((s) => s.selectedMonth);
  const data = useDashboard(selectedMonth);
  const fmt = useCurrencyFormatter();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Your financial overview at a glance"
      />

      <MonthSelector />

      {data === undefined ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64 w-full lg:col-span-2" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-72 w-full" />
        </>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Expenses"
              value={fmt(data.totalExpenses)}
              icon={ArrowUpRight}
              trend="down"
            />
            <StatCard
              title="Income"
              value={fmt(data.totalIncome)}
              icon={ArrowDownLeft}
              trend="up"
            />
            <StatCard
              title="Net"
              value={fmt(data.net)}
              icon={TrendingUp}
              trend={data.net >= 0 ? "up" : "down"}
            />
            <StatCard
              title="Upcoming Subs"
              value={`${data.upcomingSubscriptions.length} due`}
              icon={RefreshCw}
            />
          </div>

          {/* Goals widget */}
          <GoalsWidget />

          {/* Wealth widget */}
          <WealthWidget />

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <MonthlyTrendChart data={data.monthlyTrend} />
            </div>
            <CategoryBreakdownChart data={data.categoryBreakdown} />
          </div>

          {/* Recent transactions */}
          <RecentTransactions transactions={data.recentTransactions} />
        </>
      )}
    </div>
  );
}
