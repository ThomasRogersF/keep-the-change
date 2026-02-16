"use client";

import { useMemo } from "react";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useCategories } from "@/lib/hooks/use-categories";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const categories = useCategories();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => {
              const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : null;
              return (
                <div key={tx.id} className="flex items-center gap-3 py-2">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                    tx.type === "expense" ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                  )}>
                    {tx.type === "expense" ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.note || (tx.type === "expense" ? "Expense" : "Income")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.date)}{cat && ` · ${cat.name}`}
                    </p>
                  </div>
                  <span className={cn(
                    "text-sm font-medium tabular-nums shrink-0",
                    tx.type === "expense" ? "text-foreground" : "text-success"
                  )}>
                    {tx.type === "expense" ? "-" : "+"}{fmt(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
