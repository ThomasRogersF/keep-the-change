"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Pencil,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useEmergencyFundSummary, useEmergencyFundActivities } from "@/lib/hooks/use-emergency-funds";
import { EmergencyProgressRing } from "@/components/wealth/emergency/emergency-progress-ring";
import { EmergencyFundForm } from "@/components/wealth/emergency/emergency-fund-form";
import { EmergencyContributionDialog } from "@/components/wealth/emergency/emergency-contribution-dialog";
import { EmergencyWithdrawalDialog } from "@/components/wealth/emergency/emergency-withdrawal-dialog";
import { ReplenishmentCalculator } from "@/components/wealth/emergency/replenishment-calculator";
import { EMERGENCY_WITHDRAWAL_REASON_LABELS } from "@/lib/schemas/emergency-fund.schema";
import {
  deleteEmergencyFundActivity,
  deleteEmergencyFundCascade,
} from "@/lib/services/emergency-fund.service";
import { useUIStore } from "@/lib/stores/ui.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function EmergencyFundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fundId = params.id as string;
  const fmt = useCurrencyFormatter();
  const openModal = useUIStore((s) => s.openModal);
  const summary = useEmergencyFundSummary(fundId);
  const activities = useEmergencyFundActivities(fundId);

  const [contributeOpen, setContributeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);

  if (!summary) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Emergency fund not found</p>
      </div>
    );
  }

  const { fund, currentBalance, targetAmount, progressPercent, monthsCovered, amountRemaining, monthlyContributionAverage, lastContributionDate, totalWithdrawals, yieldProfile } = summary;

  const handleDeleteActivity = async (id: string) => {
    try {
      await deleteEmergencyFundActivity(id);
      toast.success("Activity removed");
    } catch {
      toast.error("Failed to remove activity");
    }
    setDeletingActivityId(null);
  };

  const handleDeleteFund = async () => {
    try {
      await deleteEmergencyFundCascade(fundId);
      toast.success("Emergency fund deleted");
      router.push("/wealth/emergency");
    } catch {
      toast.error("Failed to delete emergency fund");
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <Link
        href="/wealth/emergency"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Emergency Funds
      </Link>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <EmergencyProgressRing percent={progressPercent} size={80} strokeWidth={7} />
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary shrink-0" />
                <h1 className="text-2xl font-semibold tracking-tight">{fund.name}</h1>
                {yieldProfile && (
                  <Badge variant="outline" className="font-normal">
                    {yieldProfile.currentRate}% {yieldProfile.rateType}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {monthsCovered.toFixed(1)} of {fund.targetMonths} months covered
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={() => setContributeOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Contribute
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWithdrawOpen(true)}>
              <ArrowUpRight className="w-4 h-4 mr-1" />
              Withdraw
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border bg-card p-4">
          <div>
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p className="text-lg font-semibold tabular-nums">{fmt(currentBalance)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="text-lg font-semibold tabular-nums">{fmt(targetAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Amount Remaining</p>
            <p className="text-lg font-semibold tabular-nums">{fmt(amountRemaining)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg. Monthly Contribution</p>
            <p className="text-lg font-semibold tabular-nums">{fmt(monthlyContributionAverage)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span>
            Last contribution:{" "}
            <span className="text-foreground">{lastContributionDate ?? "None yet"}</span>
          </span>
          <span>
            Total withdrawals: <span className="text-foreground">{fmt(totalWithdrawals)}</span>
          </span>
        </div>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="replenish">Replenish</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <div className="rounded-xl border bg-card">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add a contribution to get started
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors group"
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                        activity.type === "contribution"
                          ? "bg-success/10 text-success"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {activity.type === "contribution" ? (
                        <Plus className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.type === "contribution"
                          ? "Contribution"
                          : `Withdrawal — ${
                              activity.reason ? EMERGENCY_WITHDRAWAL_REASON_LABELS[activity.reason] : "Other"
                            }`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.date}
                        {activity.note && ` · ${activity.note}`}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium tabular-nums shrink-0",
                        activity.type === "contribution" ? "text-success" : "text-foreground"
                      )}
                    >
                      {activity.type === "contribution" ? "+" : "-"}
                      {fmt(activity.amount)}
                    </span>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <AlertDialog
                        open={deletingActivityId === activity.id}
                        onOpenChange={(open) => !open && setDeletingActivityId(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeletingActivityId(activity.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove this activity?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will reverse its effect on the fund&apos;s balance. This cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteActivity(activity.id)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="replenish">
          <ReplenishmentCalculator shortfall={amountRemaining} />
        </TabsContent>

        <TabsContent value="settings">
          <div className="rounded-xl border bg-card p-5 space-y-6 max-w-lg">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Fund Settings</h3>
              <Button variant="outline" size="sm" onClick={() => openModal("emergencyFund", "edit", fundId)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Emergency Fund
              </Button>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-medium">Actions</h3>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Emergency Fund
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this emergency fund?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the fund and its activity history. The linked account and its
                      balance are not affected. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteFund}>
                      Delete Emergency Fund
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <EmergencyFundForm />
      <EmergencyContributionDialog fundId={fundId} open={contributeOpen} onOpenChange={setContributeOpen} />
      <EmergencyWithdrawalDialog
        fundId={fundId}
        currentBalance={currentBalance}
        targetAmount={targetAmount}
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
      />
    </div>
  );
}
