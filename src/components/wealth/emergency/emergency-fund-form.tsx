"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createEmergencyFundSchema,
  type CreateEmergencyFundFormData,
} from "@/lib/schemas/emergency-fund.schema";
import { useUIStore } from "@/lib/stores/ui.store";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { useEmergencyFund } from "@/lib/hooks/use-emergency-funds";
import {
  createEmergencyFundWithAccount,
  updateEmergencyFund,
} from "@/lib/services/emergency-fund.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmergencyFundForm() {
  const { activeModal, closeModal } = useUIStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const mainCurrency = useSettingsStore((s) => s.currency);
  const defaultWealthCurrency = useSettingsStore((s) => s.defaultWealthCurrency);
  const currency = defaultWealthCurrency || mainCurrency;

  const isOpen = activeModal?.type === "emergencyFund";
  const isEdit = activeModal?.mode === "edit";
  const editId = activeModal?.id;
  const existingFund = useEmergencyFund(isEdit ? editId : undefined);

  const form = useForm<CreateEmergencyFundFormData>({
    resolver: zodResolver(createEmergencyFundSchema),
    defaultValues: {
      name: "",
      monthlyExpenses: 0,
      targetMonths: 3,
      openingBalance: 0,
      institution: "",
    },
  });

  useEffect(() => {
    if (isOpen && isEdit && existingFund) {
      form.reset({
        name: existingFund.name,
        monthlyExpenses: existingFund.monthlyExpenses,
        targetMonths: existingFund.targetMonths,
        openingBalance: 0,
        institution: "",
      });
    } else if (isOpen && !isEdit) {
      form.reset({
        name: "",
        monthlyExpenses: 0,
        targetMonths: 3,
        openingBalance: 0,
        institution: "",
      });
    }
  }, [isOpen, isEdit, existingFund, form]);

  const onSubmit = async (data: CreateEmergencyFundFormData) => {
    try {
      if (isEdit && editId) {
        await updateEmergencyFund(editId, {
          name: data.name,
          monthlyExpenses: data.monthlyExpenses,
          targetMonths: data.targetMonths,
        });
        toast.success("Emergency fund updated");
      } else {
        await createEmergencyFundWithAccount({
          name: data.name,
          monthlyExpenses: data.monthlyExpenses,
          targetMonths: data.targetMonths,
          openingBalance: data.openingBalance,
          institution: data.institution || undefined,
          currency,
        });
        toast.success("Emergency fund created");
      }
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fundName">Fund name</Label>
        <Input
          id="fundName"
          placeholder="e.g. Personal Emergency Fund"
          {...form.register("name")}
          autoFocus
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthlyExpenses">Essential monthly expenses</Label>
          <Input
            id="monthlyExpenses"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            {...form.register("monthlyExpenses", { valueAsNumber: true })}
          />
          {form.formState.errors.monthlyExpenses && (
            <p className="text-xs text-destructive">
              {form.formState.errors.monthlyExpenses.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetMonths">Target months</Label>
          <Input
            id="targetMonths"
            type="number"
            step="1"
            min="1"
            {...form.register("targetMonths", { valueAsNumber: true })}
          />
          {form.formState.errors.targetMonths && (
            <p className="text-xs text-destructive">{form.formState.errors.targetMonths.message}</p>
          )}
        </div>
      </div>

      {!isEdit && (
        <>
          <div className="space-y-2">
            <Label htmlFor="openingBalance">Opening balance</Label>
            <Input
              id="openingBalance"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...form.register("openingBalance", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Ledgerly creates a dedicated account to hold this reserve.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="institution">Institution (optional)</Label>
            <Input id="institution" placeholder="e.g. Ally Bank" {...form.register("institution")} />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={closeModal}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {isEdit ? "Update" : "Create Emergency Fund"}
        </Button>
      </div>
    </form>
  );

  const title = isEdit ? "Edit Emergency Fund" : "New Emergency Fund";

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
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
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">{formContent}</div>
      </SheetContent>
    </Sheet>
  );
}
