"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, type TransactionFormData } from "@/lib/schemas/transaction.schema";
import { db } from "@/lib/db/database";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
import { useGoals } from "@/lib/hooks/use-goals";
import { useUIStore } from "@/lib/stores/ui.store";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TransactionForm() {
  const { activeModal, closeModal } = useUIStore();
  const accounts = useAccounts() ?? [];
  const categories = useCategories() ?? [];
  const goals = useGoals() ?? [];

  const isOpen = activeModal?.type === "transaction";
  const isEdit = activeModal?.mode === "edit";
  const editId = activeModal?.id;

  const [applyToGoal, setApplyToGoal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [goalAmount, setGoalAmount] = useState(0);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
      type: "expense",
      accountId: "",
      categoryId: "",
      note: "",
      tags: [],
    },
  });

  const watchType = form.watch("type");
  const watchAccountId = form.watch("accountId");
  const watchAmount = form.watch("amount");

  // Filter goals to those on the same account
  const eligibleGoals = goals.filter(
    (g) => !g.archived && (!watchAccountId || g.accountId === watchAccountId)
  );

  useEffect(() => {
    if (isOpen && isEdit && editId) {
      db.transactions.get(editId).then((tx) => {
        if (tx) {
          form.reset({
            date: tx.date,
            amount: tx.amount,
            type: tx.type,
            accountId: tx.accountId,
            categoryId: tx.categoryId || "",
            note: tx.note || "",
            tags: tx.tags || [],
          });
        }
      });
      setApplyToGoal(false);
      setSelectedGoalId("");
      setGoalAmount(0);
    } else if (isOpen && !isEdit) {
      form.reset({
        date: new Date(),
        amount: 0,
        type: "expense",
        accountId: accounts[0]?.id || "",
        categoryId: "",
        note: "",
        tags: [],
      });
      setApplyToGoal(false);
      setSelectedGoalId("");
      setGoalAmount(0);
    }
  }, [isOpen, isEdit, editId, accounts, form]);

  // Update goal amount when transaction amount changes
  useEffect(() => {
    if (applyToGoal && watchAmount > 0) {
      setGoalAmount(watchAmount);
    }
  }, [watchAmount, applyToGoal]);

  const onSubmit = async (data: TransactionFormData) => {
    try {
      if (isEdit && editId) {
        await db.transactions.update(editId, {
          ...data,
          updatedAt: new Date(),
        });
        toast.success("Transaction updated");
      } else {
        const txId = crypto.randomUUID();
        await db.transactions.add({
          id: txId,
          ...data,
          tags: data.tags || [],
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        });

        // Create GoalSpendLink if applicable
        if (
          applyToGoal &&
          selectedGoalId &&
          goalAmount > 0 &&
          data.type === "expense"
        ) {
          await db.goalSpendLinks.add({
            id: crypto.randomUUID(),
            goalId: selectedGoalId,
            transactionId: txId,
            amountApplied: goalAmount,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          });
        }

        toast.success("Transaction added");
      }
      closeModal();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as "expense" | "income")}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("amount", { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.watch("date") ? format(form.watch("date"), "yyyy-MM-dd") : ""}
              onChange={(e) => form.setValue("date", new Date(e.target.value + "T12:00:00"))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">Account</Label>
            <Select
              value={form.watch("accountId")}
              onValueChange={(v) => form.setValue("accountId", v)}
            >
              <SelectTrigger id="accountId">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.accountId && (
              <p className="text-xs text-destructive">{form.formState.errors.accountId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select
              value={form.watch("categoryId") || "none"}
              onValueChange={(v) => form.setValue("categoryId", v === "none" ? "" : v)}
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="Add a note..."
              rows={2}
              {...form.register("note")}
            />
          </div>

          {/* Apply to goal section — only for new expense transactions */}
          {!isEdit && watchType === "expense" && eligibleGoals.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="applyToGoal" className="text-sm cursor-pointer">
                  Apply to goal
                </Label>
                <Switch
                  id="applyToGoal"
                  checked={applyToGoal}
                  onCheckedChange={setApplyToGoal}
                />
              </div>
              {applyToGoal && (
                <div className="space-y-3 pl-0">
                  <div className="space-y-2">
                    <Label htmlFor="goalSelect" className="text-xs">Goal</Label>
                    <Select
                      value={selectedGoalId}
                      onValueChange={setSelectedGoalId}
                    >
                      <SelectTrigger id="goalSelect">
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleGoals.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goalAmt" className="text-xs">Amount to apply</Label>
                    <Input
                      id="goalAmt"
                      type="number"
                      step="0.01"
                      min="0"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
