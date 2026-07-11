"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import {
  useAssetHolding,
  useHoldingSummary,
  useInvestmentActivities,
} from "@/lib/hooks/use-investments";
import { ManualPriceUpdateDialog } from "@/components/wealth/investments/manual-price-update-dialog";
import { InvestmentActivityForm } from "@/components/wealth/investments/investment-activity-form";
import { deleteInvestmentActivity, deleteAssetHoldingCascade } from "@/lib/services/investment.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const ACTIVITY_LABELS: Record<string, string> = {
  buy: "Bought",
  sell: "Sold",
  dividend: "Dividend",
  fee: "Fee",
  priceUpdate: "Price update",
};

export default function HoldingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const holdingId = params.id as string;
  const fmt = useCurrencyFormatter();

  const holding = useAssetHolding(holdingId);
  const summary = useHoldingSummary(holdingId);
  const activities = useInvestmentActivities(holdingId);

  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [activityFormOpen, setActivityFormOpen] = useState(false);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);

  if (!holding || !summary) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Holding not found</p>
      </div>
    );
  }

  const isPositive = summary.unrealizedGain >= 0;
  const avgCost = holding.quantity > 0 ? holding.costBasisTotal / holding.quantity : 0;

  const handleDeleteActivity = async (id: string) => {
    try {
      await deleteInvestmentActivity(id);
      toast.success("Activity removed");
    } catch {
      toast.error("Failed to remove activity");
    }
    setDeletingActivityId(null);
  };

  const handleDeleteHolding = async () => {
    try {
      await deleteAssetHoldingCascade(holdingId);
      toast.success("Holding deleted");
      router.push("/wealth/investments");
    } catch {
      toast.error("Failed to delete holding");
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <Link
        href="/wealth/investments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Investments
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{holding.symbol}</h1>
            <Badge variant="secondary" className="capitalize font-normal">
              {holding.assetType}
            </Badge>
            {!summary.isActive && (
              <Badge variant="outline" className="font-normal text-muted-foreground">
                Closed
              </Badge>
            )}
          </div>
          {holding.name && <p className="text-sm text-muted-foreground mt-0.5">{holding.name}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={() => setActivityFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Log Activity
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPriceDialogOpen(true)}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Update Price
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl border bg-card p-4">
        <div>
          <p className="text-xs text-muted-foreground">Current Value</p>
          <p className="text-lg font-semibold tabular-nums">{fmt(summary.currentValue)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Cost Basis</p>
          <p className="text-lg font-semibold tabular-nums">{fmt(summary.costBasis)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Unrealized Gain/Loss</p>
          <p
            className={cn(
              "text-lg font-semibold tabular-nums flex items-center gap-1",
              isPositive ? "text-success" : "text-destructive"
            )}
          >
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {fmt(summary.unrealizedGain)} ({summary.unrealizedGainPercent.toFixed(1)}%)
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Realized Gain/Loss</p>
          <p className="text-lg font-semibold tabular-nums">{fmt(summary.realizedGain)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
        <span>
          Quantity: <span className="text-foreground">{holding.quantity}</span>
        </span>
        <span>
          Avg cost: <span className="text-foreground">{fmt(avgCost)}</span>
        </span>
        <span>
          Current price: <span className="text-foreground">{fmt(holding.currentPricePerUnit)}</span>
        </span>
        <span>
          Last updated:{" "}
          <span className="text-foreground">
            {holding.priceUpdatedAt ? holding.priceUpdatedAt.toLocaleDateString() : "Never"}
          </span>
        </span>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium">Activity</h3>
        </div>
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {ACTIVITY_LABELS[activity.type] ?? activity.type}
                    {activity.quantity ? ` — ${activity.quantity} units` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.date}
                    {activity.note && ` · ${activity.note}`}
                  </p>
                </div>
                <span className="text-sm font-medium tabular-nums shrink-0">
                  {activity.pricePerUnit ? fmt(activity.pricePerUnit) : activity.amount ? fmt(activity.amount) : ""}
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
                          This will reverse its effect on the holding and account balance. This cannot
                          be undone.
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

      <div className="rounded-xl border bg-card p-5 space-y-3 max-w-lg">
        <h3 className="text-sm font-medium">Actions</h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Holding
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this holding?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the holding and its activity log. It does not reverse cash already moved
                to or from your brokerage balance by past buys and sells. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteHolding}>Delete Holding</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <ManualPriceUpdateDialog holding={holding} open={priceDialogOpen} onOpenChange={setPriceDialogOpen} />
      <InvestmentActivityForm
        wealthAccountId={holding.wealthAccountId}
        holdings={[holding]}
        defaultHoldingId={holding.id}
        open={activityFormOpen}
        onOpenChange={setActivityFormOpen}
      />
    </div>
  );
}
