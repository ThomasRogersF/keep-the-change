"use client";

import { ArrowLeftRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui.store";

export default function TransactionsPage() {
  const openModal = useUIStore((s) => s.openModal);

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
      <EmptyState
        icon={ArrowLeftRight}
        title="No transactions yet"
        description="Add your first transaction to start tracking your spending and income."
        action={{
          label: "Add Transaction",
          onClick: () => openModal("transaction", "create"),
        }}
      />
    </div>
  );
}
