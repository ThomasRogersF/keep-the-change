"use client";

import { FintechCard } from "@/components/ui/fintech-card";
import { RankedBarList } from "@/components/ui/ranked-bar-list";
import { FinancialActivityIcon } from "@/components/ui/financial-activity-icon";

interface CategoryBreakdownChartProps {
  data: Array<{
    categoryId: string;
    name: string;
    colorToken: string;
    total: number;
  }>;
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <FintechCard className="p-5 flex flex-col h-full">
        <h3 className="text-base font-semibold mb-6">By Category</h3>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground pb-4">
          No expense data
        </div>
      </FintechCard>
    );
  }

  const items = data.map(d => ({
    id: d.categoryId,
    label: d.name,
    value: d.total,
    icon: <FinancialActivityIcon category={d.name} className="w-4 h-4" />,
    colorClass: "bg-finance-budgeting",
  }));

  return (
    <FintechCard className="p-5 h-full">
      <h3 className="text-base font-semibold mb-6">By Category</h3>
      <RankedBarList items={items.slice(0, 8)} />
    </FintechCard>
  );
}

