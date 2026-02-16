"use client";

import { RefreshCw, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SubscriptionList } from "@/components/subscriptions/subscription-list";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui.store";
import { useSubscriptions } from "@/lib/hooks/use-subscriptions";
import { useCategories } from "@/lib/hooks/use-categories";

export default function SubscriptionsPage() {
  const openModal = useUIStore((s) => s.openModal);
  const subscriptions = useSubscriptions();
  const categories = useCategories();

  const hasSubscriptions = subscriptions.length > 0;

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

      {hasSubscriptions ? (
        <SubscriptionList subscriptions={subscriptions} categories={categories} />
      ) : (
        <EmptyState
          icon={RefreshCw}
          title="No subscriptions yet"
          description="Track your recurring subscriptions and never miss a renewal date."
          action={{
            label: "Add Subscription",
            onClick: () => openModal("subscription", "create"),
          }}
        />
      )}

      <SubscriptionForm />
    </div>
  );
}
