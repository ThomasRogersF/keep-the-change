"use client";

import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export default function DashboardPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Your financial overview at a glance"
      />
      <EmptyState
        icon={LayoutDashboard}
        title="No data yet"
        description="Add some transactions, income, or subscriptions to see your financial overview here."
      />
    </div>
  );
}
