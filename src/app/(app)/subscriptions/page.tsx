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
import { Skeleton } from "@/components/ui/skeleton";

export default function SubscriptionsPage() {
  const openModal = useUIStore((s) => s.openModal);
  const subscriptions = useSubscriptions();
  const categories = useCategories();

  const isLoading = subscriptions === undefined || categories === undefined;

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

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No subscriptions yet"
          description="Track your recurring subscriptions and never miss a renewal date."
          action={{
            label: "Add Subscription",
            onClick: () => openModal("subscription", "create"),
          }}
        />
      ) : (
        <SubscriptionList subscriptions={subscriptions} categories={categories} />
      )}

      <SubscriptionForm />
    </div>
  );
}
