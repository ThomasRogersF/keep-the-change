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
import { useIncome, useIncomeTotal } from "@/lib/hooks/use-income";

export default function IncomePage() {
  const openModal = useUIStore((s) => s.openModal);
  const selectedMonth = useSettingsStore((s) => s.selectedMonth);
  const entries = useIncome(selectedMonth);
  const total = useIncomeTotal(selectedMonth);

  const hasEntries = entries.length > 0;

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

      {hasEntries ? (
        <IncomeTable entries={entries} total={total} />
      ) : (
        <EmptyState
          icon={TrendingUp}
          title="No income entries yet"
          description="Add your income sources to track earnings month over month."
          action={{
            label: "Add Income",
            onClick: () => openModal("income", "create"),
          }}
        />
      )}

      <IncomeForm />
    </div>
  );
}
