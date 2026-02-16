"use client";

import { RefreshCw, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui.store";

export default function SubscriptionsPage() {
  const openModal = useUIStore((s) => s.openModal);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Subscriptions"
        subtitle="Manage your recurring payments"
        action={
          <Button onClick={() => openModal("subscription", "create")} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Subscription
          </Button>
        }
      />
      <EmptyState
        icon={RefreshCw}
        title="No subscriptions yet"
        description="Track your recurring subscriptions and never miss a renewal date."
        action={{
          label: "Add Subscription",
          onClick: () => openModal("subscription", "create"),
        }}
      />
    </div>
  );
}
