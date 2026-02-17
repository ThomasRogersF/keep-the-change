"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incomeSchema, type IncomeFormData } from "@/lib/schemas/income.schema";
import { db } from "@/lib/db/database";
import { useUIStore } from "@/lib/stores/ui.store";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { toast } from "sonner";
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

export function IncomeForm() {
  const { activeModal, closeModal } = useUIStore();
  const selectedMonth = useSettingsStore((s) => s.selectedMonth);

  const isOpen = activeModal?.type === "income";
  const isEdit = activeModal?.mode === "edit";
  const editId = activeModal?.id;

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      month: selectedMonth,
      source: "",
      amount: 0,
      note: "",
    },
  });

  useEffect(() => {
    if (isOpen && isEdit && editId) {
      db.incomeEntries.get(editId).then((entry) => {
        if (entry) {
          form.reset({
            month: entry.month,
            source: entry.source,
            amount: entry.amount,
            note: entry.note || "",
          });
        }
      });
    } else if (isOpen && !isEdit) {
      form.reset({
        month: selectedMonth,
        source: "",
        amount: 0,
        note: "",
      });
    }
  }, [isOpen, isEdit, editId, selectedMonth, form]);

  const onSubmit = async (data: IncomeFormData) => {
    try {
      if (isEdit && editId) {
        await db.incomeEntries.update(editId, {
          ...data,
          updatedAt: new Date(),
        });
        toast.success("Income updated");
      } else {
        await db.incomeEntries.add({
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        });
        toast.success("Income added");
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
          <DialogTitle>{isEdit ? "Edit Income" : "Add Income"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="e.g. Salary"
                {...form.register("source")}
              />
              {form.formState.errors.source && (
                <p className="text-xs text-destructive">{form.formState.errors.source.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-amount">Amount</Label>
              <Input
                id="income-amount"
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
            <Label htmlFor="month">Month</Label>
            <Input
              id="month"
              type="month"
              value={form.watch("month")}
              onChange={(e) => form.setValue("month", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-note">Note</Label>
            <Textarea
              id="income-note"
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
