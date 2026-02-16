"use client";

import { useMemo } from "react";
import type { Subscription, Category } from "@/lib/types";
import { useUIStore } from "@/lib/stores/ui.store";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { formatDate } from "@/lib/utils/format";
import { CADENCE_LABELS } from "@/lib/utils/constants";
import { db } from "@/lib/db/database";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Pencil, Trash2, RefreshCw, Pause, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface SubscriptionListProps {
  subscriptions: Subscription[];
  categories: Category[];
}

export function SubscriptionList({ subscriptions, categories }: SubscriptionListProps) {
  const openModal = useUIStore((s) => s.openModal);
  const fmt = useCurrencyFormatter();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const { upcoming, active, paused } = useMemo(() => {
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcoming: Subscription[] = [];
    const active: Subscription[] = [];
    const paused: Subscription[] = [];

    for (const sub of subscriptions) {
      if (!sub.active) {
        paused.push(sub);
      } else if (sub.nextRenewalDate <= sevenDays) {
        upcoming.push(sub);
      } else {
        active.push(sub);
      }
    }

    upcoming.sort((a, b) => a.nextRenewalDate.getTime() - b.nextRenewalDate.getTime());
    active.sort((a, b) => a.nextRenewalDate.getTime() - b.nextRenewalDate.getTime());

    return { upcoming, active, paused };
  }, [subscriptions]);

  const monthlyTotal = useMemo(() => {
    return subscriptions
      .filter((s) => s.active)
      .reduce((sum, s) => {
        if (s.cadence === "weekly") return sum + s.amount * 4.33;
        if (s.cadence === "yearly") return sum + s.amount / 12;
        return sum + s.amount;
      }, 0);
  }, [subscriptions]);

  const handleDelete = async (id: string) => {
    await db.subscriptions.delete(id);
    toast.success("Subscription deleted");
  };

  const handleToggleActive = async (sub: Subscription) => {
    await db.subscriptions.update(sub.id, { active: !sub.active, updatedAt: new Date() });
    toast.success(sub.active ? "Subscription paused" : "Subscription reactivated");
  };

  const renderCard = (sub: Subscription) => {
    const cat = sub.categoryId ? categoryMap.get(sub.categoryId) : null;
    const isUpcoming = sub.active && sub.nextRenewalDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return (
      <Card key={sub.id} className={cn("group transition-colors", !sub.active && "opacity-60")}>
        <CardContent className="flex items-center gap-4 py-4">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
            isUpcoming ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
          )}>
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{sub.name}</p>
              {!sub.active && (
                <Badge variant="secondary" className="text-xs">Paused</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {fmt(sub.amount)}/{CADENCE_LABELS[sub.cadence]}
              {cat && ` · ${cat.name}`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-medium tabular-nums">{fmt(sub.amount)}</p>
            <p className={cn(
              "text-xs",
              isUpcoming ? "text-warning font-medium" : "text-muted-foreground"
            )}>
              {formatDate(sub.nextRenewalDate)}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openModal("subscription", "edit", sub.id)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleActive(sub)}>
                {sub.active ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {sub.active ? "Pause" : "Reactivate"}
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete subscription?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(sub.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Monthly total */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Monthly equivalent</p>
            <p className="text-xl font-semibold tabular-nums">{fmt(monthlyTotal)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming renewals */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-warning">Upcoming this week</h3>
          <div className="space-y-2">{upcoming.map(renderCard)}</div>
        </div>
      )}

      {/* Active */}
      {active.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Active</h3>
          <div className="space-y-2">{active.map(renderCard)}</div>
        </div>
      )}

      {/* Paused */}
      {paused.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Paused</h3>
          <div className="space-y-2">{paused.map(renderCard)}</div>
        </div>
      )}
    </div>
  );
}
