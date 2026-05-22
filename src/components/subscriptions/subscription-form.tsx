"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscriptionSchema, type SubscriptionFormData } from "@/lib/schemas/subscription.schema";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SubscriptionForm() {
  const { activeModal, closeModal } = useUIStore();
  const accounts = useAccounts() ?? [];
  const categories = useCategories() ?? [];

  const isOpen = activeModal?.type === "subscription";
  const isEdit = activeModal?.mode === "edit";
  const editId = activeModal?.id;

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: "",
      amount: 0,
      cadence: "monthly",
      nextRenewalDate: new Date(),
      accountId: "",
      categoryId: "",
      active: true,
    },
  });

  useEffect(() => {
    if (isOpen && isEdit && editId) {
      db.subscriptions.get(editId).then((sub) => {
        if (sub) {
          form.reset({
            name: sub.name,
            amount: sub.amount,
            cadence: sub.cadence,
            nextRenewalDate: sub.nextRenewalDate,
            accountId: sub.accountId,
            categoryId: sub.categoryId || "",
            active: sub.active,
          });
        }
      });
    } else if (isOpen && !isEdit) {
      form.reset({
        name: "",
        amount: 0,
        cadence: "monthly",
        nextRenewalDate: new Date(),
        accountId: accounts[0]?.id || "",
        categoryId: "",
        active: true,
      });
    }
  }, [isOpen, isEdit, editId, accounts, form]);

  const onSubmit = async (data: SubscriptionFormData) => {
    try {
      if (isEdit && editId) {
        await db.subscriptions.update(editId, {
          ...data,
          updatedAt: new Date(),
        });
        toast.success("Subscription updated");
      } else {
        await db.subscriptions.add({
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        });
        toast.success("Subscription added");
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
          <DialogTitle>{isEdit ? "Edit Subscription" : "Add Subscription"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sub-name">Name</Label>
            <Input
              id="sub-name"
              placeholder="e.g. Netflix"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-amount">Amount</Label>
              <Input
                id="sub-amount"
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
            <div className="space-y-2">
              <Label htmlFor="cadence">Cadence</Label>
              <Select
                value={form.watch("cadence")}
                onValueChange={(v) => form.setValue("cadence", v as "weekly" | "monthly" | "yearly")}
              >
                <SelectTrigger id="cadence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextRenewalDate">Next Renewal</Label>
            <Input
              id="nextRenewalDate"
              type="date"
              value={form.watch("nextRenewalDate") ? format(form.watch("nextRenewalDate"), "yyyy-MM-dd") : ""}
              onChange={(e) => form.setValue("nextRenewalDate", new Date(e.target.value + "T12:00:00"))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-account">Account</Label>
            <Select
              value={form.watch("accountId")}
              onValueChange={(v) => form.setValue("accountId", v)}
            >
              <SelectTrigger id="sub-account">
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
            <Label htmlFor="sub-category">Category</Label>
            <Select
              value={form.watch("categoryId") || "none"}
              onValueChange={(v) => form.setValue("categoryId", v === "none" ? "" : v)}
            >
              <SelectTrigger id="sub-category">
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

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={form.watch("active")}
              onCheckedChange={(checked) => form.setValue("active", checked)}
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
