"use client";

import { ArrowLeftRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui.store";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useCategories } from "@/lib/hooks/use-categories";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsPage() {
  const openModal = useUIStore((s) => s.openModal);
  const transactions = useTransactions();
  const categories = useCategories();
  const accounts = useAccounts();

  const isLoading =
    transactions === undefined || categories === undefined || accounts === undefined;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Transactions"
        subtitle="Track your spending and income"
        action={
          <Button onClick={() => openModal("transaction", "create")} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Transaction
          </Button>
        }
      />

      {isLoading ? (
        <>
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions yet"
          description="Add your first transaction to start tracking your spending and income."
          action={{
            label: "Add Transaction",
            onClick: () => openModal("transaction", "create"),
          }}
        />
      ) : (
        <>
          <TransactionFilters />
          <TransactionList
            transactions={transactions}
            categories={categories}
            accounts={accounts}
          />
        </>
      )}

      <TransactionForm />
    </div>
  );
}
