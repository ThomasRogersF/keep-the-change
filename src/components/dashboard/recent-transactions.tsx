"use client";

import { useMemo } from "react";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useCategories } from "@/lib/hooks/use-categories";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { FintechCard } from "@/components/ui/fintech-card";
import { FinancialActivityIcon } from "@/components/ui/financial-activity-icon";

interface RecentTransactionsProps {
  transactions: Array<{
    id: string;
    date: Date;
    amount: number;
    type: "expense" | "income";
    categoryId?: string;
    accountId: string;
    note?: string;
  }>;
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const fmt = useCurrencyFormatter();
  const categories = useCategories() ?? [];

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  return (
    <FintechCard className="p-0">
      <div className="px-5 pt-5 pb-2">
        <h3 className="text-base font-semibold">Recent Transactions</h3>
      </div>
      <div className="p-1 px-3">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No transactions yet</p>
        ) : (
          <div className="space-y-1 pb-3">
            {transactions.map((tx) => {
              const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : null;

              // Use tx.note if available, otherwise name of category, otherwise just "Expense"/"Income"
              const displayTitle = tx.note || cat?.name || (tx.type === "expense" ? "Expense" : "Income");
              // Use category or default type for icon mapping
              const iconKey = cat?.name || displayTitle;

              return (
                <div key={tx.id} className="flex items-center gap-3.5 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                    tx.type === "expense" ? "bg-finance-budgeting/10 text-finance-budgeting" : "bg-success/15 text-success"
                  )}>
                    <FinancialActivityIcon category={iconKey} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium truncate text-foreground/95">
                      {displayTitle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[15px] font-semibold tabular-nums shrink-0 tracking-tight",
                    tx.type === "expense" ? "text-foreground" : "text-success"
                  )}>
                    {tx.type === "expense" ? "-" : "+"}{fmt(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FintechCard>
  );
}
