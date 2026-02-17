"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { goalSchema, type GoalFormData } from "@/lib/schemas/goal.schema";
import { db } from "@/lib/db/database";
import { useMainAccounts } from "@/lib/hooks/use-accounts";
import { useUIStore } from "@/lib/stores/ui.store";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GoalForm() {
  const { activeModal, closeModal } = useUIStore();
  const mainAccounts = useMainAccounts();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const isOpen = activeModal?.type === "goal";
  const isEdit = activeModal?.mode === "edit";
  const editId = activeModal?.id;

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      targetDate: "",
      accountId: "",
    },
  });

  useEffect(() => {
    if (isOpen && isEdit && editId) {
      db.goals.get(editId).then((goal) => {
        if (goal) {
          form.reset({
            name: goal.name,
            targetAmount: goal.targetAmount,
            targetDate: goal.targetDate || "",
            accountId: goal.accountId,
          });
        }
      });
    } else if (isOpen && !isEdit) {
      form.reset({
        name: "",
        targetAmount: 0,
        targetDate: "",
        accountId: mainAccounts[0]?.id || "",
      });
    }
  }, [isOpen, isEdit, editId, mainAccounts, form]);

  const onSubmit = async (data: GoalFormData) => {
    try {
      const goalData = {
        name: data.name,
        targetAmount: data.targetAmount,
        targetDate: data.targetDate || undefined,
        accountId: data.accountId,
        archived: false,
      };

      if (isEdit && editId) {
        await db.goals.update(editId, {
          ...goalData,
          updatedAt: new Date(),
        });
        toast.success("Goal updated");
      } else {
        await db.goals.add({
          id: crypto.randomUUID(),
          ...goalData,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        });
        toast.success("Goal created");
      }
      closeModal();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goalName">Goal name</Label>
        <Input
          id="goalName"
          placeholder="e.g. New Laptop, Vacation Fund"
          {...form.register("name")}
          autoFocus
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetAmount">Target amount</Label>
        <Input
          id="targetAmount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...form.register("targetAmount", { valueAsNumber: true })}
        />
        {form.formState.errors.targetAmount && (
          <p className="text-xs text-destructive">{form.formState.errors.targetAmount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetDate">Target date (optional)</Label>
        <Input
          id="targetDate"
          type="date"
          min={format(new Date(), "yyyy-MM-dd")}
          {...form.register("targetDate")}
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
            {mainAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.accountId && (
          <p className="text-xs text-destructive">{form.formState.errors.accountId.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Goals are virtual allocations — your bank balance doesn&apos;t change.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={closeModal}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {isEdit ? "Update" : "Create Goal"}
        </Button>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Goal" : "New Goal"}</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Goal" : "New Goal"}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">{formContent}</div>
      </SheetContent>
    </Sheet>
  );
}
