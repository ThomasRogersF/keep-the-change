"use client";

import { useMemo } from "react";
import { Landmark } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { YieldAccountCard } from "@/components/wealth/savings/yield-account-card";
import { WealthAccountForm } from "@/components/wealth/shared/wealth-account-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useWealthAccountsByType } from "@/lib/hooks/use-wealth-accounts";
import { useEmergencyFunds } from "@/lib/hooks/use-emergency-funds";
import { useUIStore } from "@/lib/stores/ui.store";

export default function SavingsPage() {
  const openModal = useUIStore((s) => s.openModal);
  const cashAccounts = useWealthAccountsByType("cash");
  const emergencyFunds = useEmergencyFunds();

  const isLoading = cashAccounts === undefined || emergencyFunds === undefined;
  const savingsAccounts = useMemo(() => {
    if (!cashAccounts) return [];
    const linkedIds = new Set((emergencyFunds ?? []).map((f) => f.wealthAccountId));
    return cashAccounts.filter((a) => !linkedIds.has(a.id));
  }, [cashAccounts, emergencyFunds]);

  const hasAccounts = !isLoading && savingsAccounts.length > 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Savings & Yield"
        subtitle="Cash savings, high-yield accounts, and yield-bearing products"
        action={
          <Button onClick={() => openModal("wealthAccount", "create")}>Add Savings Account</Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : hasAccounts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {savingsAccounts.map((account) => (
            <YieldAccountCard key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Landmark}
          title="No savings accounts yet"
          description="Track traditional savings, high-yield accounts, and yield-bearing products like stablecoins or money market accounts."
          action={{
            label: "Add Savings Account",
            onClick: () => openModal("wealthAccount", "create"),
          }}
        />
      )}

      <WealthAccountForm />
    </div>
  );
}
