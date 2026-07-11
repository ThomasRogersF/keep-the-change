"use client";

import { useMemo, useState } from "react";
import { LineChart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { HoldingsTable } from "@/components/wealth/investments/holdings-table";
import { InvestmentHoldingCard } from "@/components/wealth/investments/investment-holding-card";
import { HoldingForm } from "@/components/wealth/investments/holding-form";
import { InvestmentActivityForm } from "@/components/wealth/investments/investment-activity-form";
import { WealthAccountForm } from "@/components/wealth/shared/wealth-account-form";
import { AssetAllocationChart } from "@/components/wealth/shared/asset-allocation-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWealthAccountsByType } from "@/lib/hooks/use-wealth-accounts";
import { useAssetHoldings, usePortfolioSummary } from "@/lib/hooks/use-investments";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useUIStore } from "@/lib/stores/ui.store";

export default function InvestmentsPage() {
  const openModal = useUIStore((s) => s.openModal);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const fmt = useCurrencyFormatter();

  const brokerageAccounts = useWealthAccountsByType("brokerage");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const scopedAccountId = selectedAccountId === "all" ? undefined : selectedAccountId;

  const holdings = useAssetHoldings(scopedAccountId);
  const summary = usePortfolioSummary(scopedAccountId);

  const [holdingFormOpen, setHoldingFormOpen] = useState(false);
  const [activityFormOpen, setActivityFormOpen] = useState(false);

  const accountNameById = useMemo(
    () => Object.fromEntries((brokerageAccounts ?? []).map((a) => [a.id, a.name])),
    [brokerageAccounts]
  );

  const isLoading = brokerageAccounts === undefined || holdings === undefined;
  const hasAccounts = !isLoading && brokerageAccounts.length > 0;
  const activeHoldings = (holdings ?? []).filter((h) => h.quantity > 0);

  const allocationData = summary.allocation.map((a) => ({ label: a.symbol, value: a.value }));
  const formAccountId = scopedAccountId ?? brokerageAccounts?.[0]?.id ?? null;
  const activityHoldings = formAccountId
    ? (holdings ?? []).filter((h) => h.wealthAccountId === formAccountId)
    : [];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Investments"
        subtitle="ETFs, stocks, crypto, and brokerage cash"
        action={
          hasAccounts ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActivityFormOpen(true)} disabled={!formAccountId}>
                Log Activity
              </Button>
              <Button onClick={() => setHoldingFormOpen(true)} disabled={!formAccountId}>
                New Holding
              </Button>
            </div>
          ) : (
            <Button onClick={() => openModal("wealthAccount", "create")}>Add Investment Account</Button>
          )
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
        <EmptyState
          icon={LineChart}
          title="No investment accounts yet"
          description="Track ETFs, stocks, crypto, and brokerage cash in one place."
          action={{
            label: "Add Investment Account",
            onClick: () => openModal("wealthAccount", "create"),
          }}
        />
      ) : (
        <>
          {brokerageAccounts.length > 1 && (
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {brokerageAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Portfolio Value" value={fmt(summary.totalValue)} icon={LineChart} />
            <StatCard title="Cost Basis" value={fmt(summary.totalCostBasis)} icon={LineChart} />
            <StatCard
              title="Unrealized Gain/Loss"
              value={fmt(summary.unrealizedGain)}
              icon={LineChart}
              trend={summary.unrealizedGain >= 0 ? "up" : "down"}
            />
            <StatCard
              title="Realized Gain/Loss"
              value={fmt(summary.realizedGain)}
              icon={LineChart}
              trend={summary.realizedGain >= 0 ? "up" : "down"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-xl border bg-card">
              {isDesktop ? (
                <HoldingsTable holdings={activeHoldings} accountNameById={accountNameById} />
              ) : activeHoldings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No holdings yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 p-3">
                  {activeHoldings.map((h) => (
                    <InvestmentHoldingCard key={h.id} holding={h} />
                  ))}
                </div>
              )}
            </div>
            <AssetAllocationChart title="Allocation" data={allocationData} emptyMessage="No holdings yet" />
          </div>
        </>
      )}

      <WealthAccountForm />
      <HoldingForm wealthAccountId={formAccountId} open={holdingFormOpen} onOpenChange={setHoldingFormOpen} />
      <InvestmentActivityForm
        wealthAccountId={formAccountId}
        holdings={activityHoldings}
        open={activityFormOpen}
        onOpenChange={setActivityFormOpen}
      />
    </div>
  );
}
