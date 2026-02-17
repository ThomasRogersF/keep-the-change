"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useGoalAllocations, useGoalSpendLinks } from "@/lib/hooks/use-goals";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus,
  Minus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface GoalActivityListProps {
  goalId: string;
  archived?: boolean;
  onEditAllocation?: (id: string) => void;
}

type ActivityItem = {
  id: string;
  type: "allocation" | "spend";
  date: string;
  amount: number;
  label: string;
  note?: string;
};

export function GoalActivityList({ goalId, archived, onEditAllocation }: GoalActivityListProps) {
  const fmt = useCurrencyFormatter();
  const allocations = useGoalAllocations(goalId);
  const spendLinks = useGoalSpendLinks(goalId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Resolve transaction notes for spend links
  const txIds = useMemo(() => spendLinks.map((l) => l.transactionId), [spendLinks]);
  const transactions = useLiveQuery(
    async () => {
      if (txIds.length === 0) return [];
      return db.transactions.where("id").anyOf(txIds).toArray();
    },
    [txIds],
    []
  );
  const txMap = useMemo(() => new Map(transactions.map((t) => [t.id, t])), [transactions]);

  const items: ActivityItem[] = useMemo(() => {
    const allItems: ActivityItem[] = [];

    for (const alloc of allocations) {
      allItems.push({
        id: alloc.id,
        type: "allocation",
        date: alloc.date,
        amount: alloc.amount,
        label: "Contribution",
        note: alloc.note,
      });
    }

    for (const link of spendLinks) {
      const tx = txMap.get(link.transactionId);
      allItems.push({
        id: link.id,
        type: "spend",
        date: tx ? new Intl.DateTimeFormat("en-CA").format(tx.date) : "",
        amount: link.amountApplied,
        label: tx?.note || "Purchase",
        note: undefined,
      });
    }

    // Sort by date descending
    return allItems.sort((a, b) => b.date.localeCompare(a.date));
  }, [allocations, spendLinks, txMap]);

  const handleDeleteAllocation = async (id: string) => {
    try {
      await db.goalAllocations.delete(id);
      toast.success("Contribution removed");
    } catch {
      toast.error("Failed to remove");
    }
    setDeletingId(null);
  };

  const handleDeleteSpendLink = async (id: string) => {
    try {
      await db.goalSpendLinks.delete(id);
      toast.success("Purchase link removed");
    } catch {
      toast.error("Failed to remove");
    }
    setDeletingId(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Add a contribution to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div
          key={`${item.type}-${item.id}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors group"
        >
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
              item.type === "allocation"
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {item.type === "allocation" ? (
              <Plus className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.label}</p>
            <p className="text-xs text-muted-foreground">
              {item.date}
              {item.note && ` · ${item.note}`}
            </p>
          </div>

          <span
            className={cn(
              "text-sm font-medium tabular-nums shrink-0",
              item.type === "allocation" ? "text-success" : "text-foreground"
            )}
          >
            {item.type === "allocation" ? "+" : "-"}
            {fmt(item.amount)}
          </span>

          {!archived && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.type === "allocation" && onEditAllocation && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEditAllocation(item.id)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
              <AlertDialog
                open={deletingId === `${item.type}-${item.id}`}
                onOpenChange={(open) => !open && setDeletingId(null)}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeletingId(`${item.type}-${item.id}`)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Remove this {item.type === "allocation" ? "contribution" : "purchase link"}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        item.type === "allocation"
                          ? handleDeleteAllocation(item.id)
                          : handleDeleteSpendLink(item.id)
                      }
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
