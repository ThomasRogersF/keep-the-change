"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useWealthAccount } from "@/lib/hooks/use-wealth-accounts";
import { useYieldSummary } from "@/lib/hooks/use-savings";
import { YieldRateBadge } from "@/components/wealth/savings/yield-rate-badge";
import { YieldProfileForm } from "@/components/wealth/savings/yield-profile-form";
import { RateHistoryList } from "@/components/wealth/savings/rate-history-list";
import { WealthAccountForm } from "@/components/wealth/shared/wealth-account-form";
import { InternalTransferDialog } from "@/components/wealth/shared/internal-transfer-dialog";
import { RiskBadge } from "@/components/wealth/shared/risk-badge";
import { LiquidityBadge } from "@/components/wealth/shared/liquidity-badge";
import { InsuranceBadge } from "@/components/wealth/shared/insurance-badge";
import { deleteYieldProfileCascade } from "@/lib/services/yield-profile.service";
import { wealthAccountRepository } from "@/lib/db/repositories/wealth-account.repository";
import { useUIStore } from "@/lib/stores/ui.store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SavingsAccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;
  const fmt = useCurrencyFormatter();
  const openModal = useUIStore((s) => s.openModal);
  const account = useWealthAccount(accountId);
  const summary = useYieldSummary(accountId);

  const [yieldFormOpen, setYieldFormOpen] = useState(false);

  if (!account) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Account not found</p>
      </div>
    );
  }

  const isDigitalAsset = account.assetClass === "crypto";

  const handleDelete = async () => {
    try {
      if (summary) {
        await deleteYieldProfileCascade(summary.profile.id);
      }
      await wealthAccountRepository.delete(accountId);
      toast.success("Account deleted");
      router.push("/wealth/savings");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <Link
        href="/wealth/savings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Savings & Yield
      </Link>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{account.name}</h1>
                {summary && (
                  <YieldRateBadge rate={summary.profile.currentRate} rateType={summary.profile.rateType} />
                )}
              </div>
              {account.institution && (
                <p className="text-sm text-muted-foreground mt-0.5">{account.institution}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => openModal("internalTransfer", "create", accountId)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Transfer
            </Button>
            <Button variant="outline" size="sm" onClick={() => setYieldFormOpen(true)}>
              {summary ? "Update Rate" : "Add Yield"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-3xl font-semibold tabular-nums">{fmt(account.balance)}</p>
          {summary ? (
            <p className="text-sm text-muted-foreground">
              Estimated monthly:{" "}
              <span className="text-foreground font-medium">{fmt(summary.estimatedMonthly)}</span>
              {" · "}
              Estimated annual:{" "}
              <span className="text-foreground font-medium">{fmt(summary.estimatedAnnual)}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No yield configured for this account yet.
            </p>
          )}
          {isDigitalAsset && (
            <p className="text-xs text-muted-foreground">
              Digital asset product — not equivalent to a traditional insured bank account.
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <RiskBadge level={account.riskLevel} />
            <LiquidityBadge liquidity={account.liquidity} />
            <InsuranceBadge insuranceType={account.insuranceType} isDigitalAsset={isDigitalAsset} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="rates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rates">Rate History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="rates">
          <div className="rounded-xl border bg-card p-2">
            {summary ? (
              <RateHistoryList profileId={summary.profile.id} rateType={summary.profile.rateType} />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Add a yield rate to start tracking history.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="rounded-xl border bg-card p-5 space-y-6 max-w-lg">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Account Settings</h3>
              <Button variant="outline" size="sm" onClick={() => openModal("wealthAccount", "edit", accountId)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Account
              </Button>
              <p className="text-xs text-muted-foreground">
                To record confirmed interest credited to this account, edit its balance directly.
              </p>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-medium">Actions</h3>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the account and its yield rate history. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete Account</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <YieldProfileForm wealthAccountId={accountId} open={yieldFormOpen} onOpenChange={setYieldFormOpen} />
      <WealthAccountForm />
      <InternalTransferDialog />
    </div>
  );
}
