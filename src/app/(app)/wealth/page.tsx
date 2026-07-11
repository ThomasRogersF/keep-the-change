"use client";

import Link from "next/link";
import { LineChart, Shield, Sparkles, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WealthSummaryCard } from "@/components/wealth/shared/wealth-summary-card";
import { WealthAccountCard } from "@/components/wealth/shared/wealth-account-card";
import { WealthActivityList } from "@/components/wealth/shared/wealth-activity-list";
import { AssetAllocationChart } from "@/components/wealth/shared/asset-allocation-chart";
import { WealthGrowthChart } from "@/components/wealth/shared/wealth-growth-chart";
import { ContributionsGrowthBar } from "@/components/wealth/shared/contributions-growth-bar";
import { WealthAccountForm } from "@/components/wealth/shared/wealth-account-form";
import { EmergencyFundForm } from "@/components/wealth/emergency/emergency-fund-form";
import { InternalTransferDialog } from "@/components/wealth/shared/internal-transfer-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWealthAccounts } from "@/lib/hooks/use-wealth-accounts";
import {
  useWealthOverviewSummary,
  useWealthActivityFeed,
  useWealthGrowthSeries,
} from "@/lib/hooks/use-wealth-overview";
import { useUIStore } from "@/lib/stores/ui.store";

export default function WealthOverviewPage() {
  const openModal = useUIStore((s) => s.openModal);
  const accounts = useWealthAccounts();
  const summary = useWealthOverviewSummary();
  const activity = useWealthActivityFeed();
  const growthSeries = useWealthGrowthSeries();

  const isLoading = accounts === undefined;
  const hasAccounts = !isLoading && accounts.length > 0;
  const allocationData = summary.allocation.map((a) => ({ label: a.category, value: a.value }));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Wealth"
        subtitle="Emergency reserves, savings, and investments in one place"
        action={
          hasAccounts ? (
            <Button onClick={() => openModal("internalTransfer", "create")}>Transfer Funds</Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      ) : !hasAccounts ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 -m-4 rounded-full bg-primary/5" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-medium mb-1">Build your financial foundation</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Track emergency savings, high-yield accounts, ETFs, and other long-term assets in one
            place.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => openModal("emergencyFund", "create")}>
              <Shield className="w-4 h-4 mr-2" />
              Create Emergency Fund
            </Button>
            <Button variant="outline" onClick={() => openModal("wealthAccount", "create")}>
              Add Savings Account
            </Button>
            <Button variant="outline" onClick={() => openModal("wealthAccount", "create")}>
              Add Investment Account
            </Button>
          </div>
        </div>
      ) : (
        <>
          <WealthSummaryCard summary={summary} />

          {summary.totalWealth === 0 && summary.accountCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Net worth reflects wealth accounts and investments only — Ledgerly doesn&apos;t track
              running budget-account balances yet.
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <WealthGrowthChart data={growthSeries} />
            </div>
            <AssetAllocationChart title="Wealth Allocation" data={allocationData} />
          </div>

          <ContributionsGrowthBar
            totalContributions={summary.totalContributions}
            totalGrowth={summary.totalGrowth}
          />

          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                Recent Activity
              </h3>
              <Link href="/wealth/activity" className="text-xs text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="p-2">
              <WealthActivityList items={activity} limit={8} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <LineChart className="w-4 h-4 text-muted-foreground" />
              Accounts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <WealthAccountCard key={account.id} account={account} />
              ))}
            </div>
          </div>
        </>
      )}

      <WealthAccountForm />
      <EmergencyFundForm />
      <InternalTransferDialog />
    </div>
  );
}
