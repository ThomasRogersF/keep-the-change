"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, type TransactionFormData } from "@/lib/schemas/transaction.schema";
import { db } from "@/lib/db/database";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useCategories } from "@/lib/hooks/use-categories";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TransactionForm() {
  const { activeModal, closeModal } = useUIStore();
  const accounts = useAccounts();
  const categories = useCategories();

  const isOpen = activeModal?.type === "transaction";
  const isEdit = activeModal?.mode === "edit";
  const editId = activeModal?.id;

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
    }
  }, [isOpen, isEdit, editId, accounts, form]);

  const onSubmit = async (data: TransactionFormData) => {
    try {
      if (isEdit && editId) {
        await db.transactions.update(editId, {
          ...data,
          updatedAt: new Date(),
        });
        toast.success("Transaction updated");
      } else {
        await db.transactions.add({
          id: crypto.randomUUID(),
          ...data,
          tags: data.tags || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
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
