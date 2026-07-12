"use client";

import { TrendingUp, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { IncomeTable } from "@/components/income/income-table";
import { IncomeForm } from "@/components/income/income-form";
import { MonthSelector } from "@/components/income/month-selector";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui.store";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { useIncome, useIncomeTotal, useIncomeTrend } from "@/lib/hooks/use-income";
import { Skeleton } from "@/components/ui/skeleton";
import { IncomeTrendChart } from "@/components/income/income-trend-chart";

export default function IncomePage() {
  const openModal = useUIStore((s) => s.openModal);
  const selectedMonth = useSettingsStore((s) => s.selectedMonth);
  const entries = useIncome(selectedMonth);
  const total = useIncomeTotal(selectedMonth);
  const trendData = useIncomeTrend(selectedMonth);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Income"
        subtitle="Track your monthly income sources"
        action={
          <Button onClick={() => openModal("income", "create")} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Income
          </Button>
        }
      />

      <MonthSelector />

      {entries === undefined ? (
        <>
          <Skeleton className="h-20 w-full" />
          <div className="space-y-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No income entries yet"
          description="Add your income sources to track earnings month over month."
          action={{
            label: "Add Income",
            onClick: () => openModal("income", "create"),
          }}
        />
      ) : (
        <div className="space-y-4">
          <IncomeTable entries={entries} total={total} />
          {trendData && trendData.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-medium text-muted-foreground">6-Month Trend</h3>
              <IncomeTrendChart data={trendData} />
            </div>
          )}
        </div>
      )}

      <IncomeForm />
    </div>
  );
}
