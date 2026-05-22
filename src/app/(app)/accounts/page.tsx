"use client";

import { Wallet, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AccountList } from "@/components/accounts/account-list";
import { AccountForm } from "@/components/accounts/account-form";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui.store";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountsPage() {
  const openModal = useUIStore((s) => s.openModal);
  const accounts = useAccounts();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Accounts"
        subtitle="Manage your budget and external accounts"
        action={
          <Button onClick={() => openModal("account", "create")} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Account
          </Button>
        }
      />

      {accounts === undefined ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Create your first account to start organizing your finances."
          action={{
            label: "Add Account",
            onClick: () => openModal("account", "create"),
          }}
        />
      ) : (
        <AccountList accounts={accounts} />
      )}

      <AccountForm />
    </div>
  );
}
