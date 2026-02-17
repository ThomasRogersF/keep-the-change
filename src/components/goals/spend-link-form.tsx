"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/database";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { useGoalProgress } from "@/lib/hooks/use-goals";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";
import { Search, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface SpendLinkFormProps {
  goalId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpendLinkForm({ goalId, open, onOpenChange }: SpendLinkFormProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const fmt = useCurrencyFormatter();
  const progress = useGoalProgress(goalId ?? undefined);
  const [search, setSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [amountApplied, setAmountApplied] = useState(0);
  const [goalName, setGoalName] = useState("");

  // Fetch expense transactions
  const expenses = useLiveQuery(
    () =>
      db.transactions
        .orderBy("date")
        .reverse()
        .filter((t) => t.type === "expense")
        .limit(100)
        .toArray(),
    [],
    []
  );

  useEffect(() => {
    if (open && goalId) {
      setSearch("");
      setSelectedTx(null);
      setAmountApplied(0);
      db.goals.get(goalId).then((g) => {
        if (g) setGoalName(g.name);
      });
    }
  }, [open, goalId]);

  useEffect(() => {
    if (selectedTx) {
      const defaultAmt =
        progress.remaining > 0
          ? Math.min(selectedTx.amount, progress.remaining)
          : selectedTx.amount;
      setAmountApplied(Math.round(defaultAmt * 100) / 100);
    }
  }, [selectedTx, progress.remaining]);

  const filtered = expenses.filter((tx) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      tx.note?.toLowerCase().includes(q) ||
      tx.amount.toString().includes(q)
    );
  });

  const handleSubmit = async () => {
    if (!goalId || !selectedTx || amountApplied <= 0) return;
    try {
      await db.goalSpendLinks.add({
        id: crypto.randomUUID(),
        goalId,
        transactionId: selectedTx.id,
        amountApplied,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });
      toast.success("Purchase linked to goal");
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const formContent = (
    <div className="space-y-4">
      {goalName && (
        <p className="text-sm text-muted-foreground">
          Linking purchase to <span className="font-medium text-foreground">{goalName}</span>
        </p>
      )}

      {!selectedTx ? (
        <>
          {/* Step 1: Select transaction */}
          <div className="space-y-2">
            <Label>Select an expense transaction</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by note or amount..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No expense transactions found
                </p>
              ) : (
                filtered.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 text-destructive shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {tx.note || "Expense"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.date)}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums shrink-0">
                      {fmt(tx.amount)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <>
          {/* Step 2: Set amount */}
          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 text-destructive shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedTx.note || "Expense"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(selectedTx.date)} · {fmt(selectedTx.amount)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTx(null)}
                className="text-xs"
              >
                Change
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkAmount">Amount to apply</Label>
            <Input
              id="linkAmount"
              type="number"
              step="0.01"
              min="0.01"
              max={selectedTx.amount}
              value={amountApplied}
              onChange={(e) => setAmountApplied(parseFloat(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Max: {fmt(selectedTx.amount)}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={amountApplied <= 0 || amountApplied > selectedTx.amount}
            >
              Link Purchase
            </Button>
          </div>
        </>
      )}

      {!selectedTx && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );

  const title = "Link Purchase to Goal";

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={cn("pb-8", selectedTx ? "" : "max-h-[85vh]")}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">{formContent}</div>
      </SheetContent>
    </Sheet>
  );
}
