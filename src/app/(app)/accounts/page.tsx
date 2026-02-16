"use client";

import { Wallet, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui.store";

export default function AccountsPage() {
  const openModal = useUIStore((s) => s.openModal);

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
      <EmptyState
        icon={Wallet}
        title="No accounts yet"
        description="Create your first account to start organizing your finances."
        action={{
          label: "Add Account",
          onClick: () => openModal("account", "create"),
        }}
      />
    </div>
  );
}
