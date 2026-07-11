"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  emergencyContributionSchema,
  type EmergencyContributionFormData,
} from "@/lib/schemas/emergency-fund.schema";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { createContribution } from "@/lib/services/emergency-fund.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EmergencyContributionDialogProps {
  fundId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const quickAmounts = [50, 100, 250, 500];

export function EmergencyContributionDialog({
  fundId,
  open,
  onOpenChange,
}: EmergencyContributionDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const form = useForm<EmergencyContributionFormData>({
    resolver: zodResolver(emergencyContributionSchema),
    defaultValues: { amount: 0, date: format(new Date(), "yyyy-MM-dd"), note: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ amount: 0, date: format(new Date(), "yyyy-MM-dd"), note: "" });
    }
  }, [open, form]);

  const onSubmit = async (data: EmergencyContributionFormData) => {
    if (!fundId) return;
    try {
      await createContribution({
        emergencyFundId: fundId,
        amount: data.amount,
        date: data.date,
        note: data.note || undefined,
      });
      toast.success("Contribution added");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const setQuickAmount = (amount: number) =>
    form.setValue("amount", amount, { shouldValidate: true });

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contribAmount">Amount</Label>
        <Input
          id="contribAmount"
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
        <Label htmlFor="contribDate">Date</Label>
        <Input id="contribDate" type="date" {...form.register("date")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contribNote">Note (optional)</Label>
        <Textarea id="contribNote" rows={2} {...form.register("note")} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Add Contribution
        </Button>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contribution</DialogTitle>
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
          <SheetTitle>Add Contribution</SheetTitle>
        </SheetHeader>
        <div className="mt-4">{formContent}</div>
      </SheetContent>
    </Sheet>
  );
}
