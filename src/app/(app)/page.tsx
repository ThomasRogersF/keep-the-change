"use client";

import { ArrowDownLeft, ArrowUpRight, RefreshCw, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MonthSelector } from "@/components/income/month-selector";
import { StatCard } from "@/components/ui/stat-card";
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="col-span-2 lg:col-span-4 max-w-full">
              <StatCard
                label="Monthly Net"
                value={data.net}
                icon={TrendingUp}
                semanticTone={data.net >= 0 ? "income" : "expense"}
                variant="emphasis"
                className="mb-1"
                trend={{
                  value: 0, // Placeholder, usually computed against previous month
                  positiveIsGood: true
                }}
              />
            </div>
            <StatCard
              label="Income"
              value={data.totalIncome}
              icon={ArrowDownLeft}
              semanticTone="income"
            />
            <StatCard
              label="Expenses"
              value={data.totalExpenses}
              icon={ArrowUpRight}
              semanticTone="budgeting"
            />
            <StatCard
              label="Upcoming Subs"
              valueNode={<span className="text-xl tabular-nums font-semibold">{data.upcomingSubscriptions.length} due</span>}
              icon={RefreshCw}
            />
            {/* Need one more space if lg:grid-cols-4? We have 3 secondary metrics. Let's make Net full width or span 2, then Income, Exp, Subs span. Let's reorganize. */}
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
