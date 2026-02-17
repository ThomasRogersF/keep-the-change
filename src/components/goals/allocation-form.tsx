"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { allocationSchema, type AllocationFormData } from "@/lib/schemas/goal.schema";
import { db } from "@/lib/db/database";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { toast } from "sonner";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";

interface AllocationFormProps {
  goalId: string | null;
  editId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickAmounts = [25, 50, 100, 250];

export function AllocationForm({ goalId, editId, open, onOpenChange }: AllocationFormProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [goalName, setGoalName] = useState("");
  const isEdit = !!editId;

  const form = useForm<AllocationFormData>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      amount: 0,
      note: "",
    },
  });

  useEffect(() => {
    if (open && goalId) {
      db.goals.get(goalId).then((g) => {
        if (g) setGoalName(g.name);
      });

      if (editId) {
        db.goalAllocations.get(editId).then((alloc) => {
          if (alloc) {
            form.reset({
              date: alloc.date,
              amount: alloc.amount,
              note: alloc.note || "",
            });
          }
        });
      } else {
        form.reset({
          date: format(new Date(), "yyyy-MM-dd"),
          amount: 0,
          note: "",
        });
      }
    }
  }, [open, goalId, editId, form]);

  const onSubmit = async (data: AllocationFormData) => {
    if (!goalId) return;
    try {
      if (isEdit && editId) {
        await db.goalAllocations.update(editId, {
          ...data,
          updatedAt: new Date(),
        });
        toast.success("Contribution updated");
      } else {
        await db.goalAllocations.add({
          id: crypto.randomUUID(),
          goalId,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        toast.success("Contribution added");
      }
      onOpenChange(false);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const setQuickAmount = (amount: number) => {
    form.setValue("amount", amount, { shouldValidate: true });
  };

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {goalName && (
        <p className="text-sm text-muted-foreground">
          Contributing to <span className="font-medium text-foreground">{goalName}</span>
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="allocAmount">Amount</Label>
        <Input
          id="allocAmount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...form.register("amount", { valueAsNumber: true })}
        />
        {form.formState.errors.amount && (
          <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
        )}
        <div className="flex gap-2">
          {quickAmounts.map((amt) => (
            <Button
              key={amt}
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs tabular-nums"
              onClick={() => setQuickAmount(amt)}
            >
              ${amt}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allocDate">Date</Label>
        <Input
          id="allocDate"
          type="date"
          {...form.register("date")}
        />
        {form.formState.errors.date && (
          <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="allocNote">Note (optional)</Label>
        <Textarea
          id="allocNote"
          placeholder="Add a note..."
          rows={2}
          {...form.register("note")}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {isEdit ? "Update" : "Add Contribution"}
        </Button>
      </div>
    </form>
  );

  const title = isEdit ? "Edit Contribution" : "Add Contribution";

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
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
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">{formContent}</div>
      </SheetContent>
    </Sheet>
  );
}
