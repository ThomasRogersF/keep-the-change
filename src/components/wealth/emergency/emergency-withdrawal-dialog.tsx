"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  emergencyWithdrawalSchema,
  emergencyWithdrawalReasons,
  EMERGENCY_WITHDRAWAL_REASON_LABELS,
  type EmergencyWithdrawalFormData,
} from "@/lib/schemas/emergency-fund.schema";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { createWithdrawal } from "@/lib/services/emergency-fund.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EmergencyWithdrawalDialogProps {
  fundId: string | null;
  currentBalance: number;
  targetAmount: number;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function EmergencyWithdrawalDialog({
  fundId,
  currentBalance,
  targetAmount,
  open,
  onOpenChange,
}: EmergencyWithdrawalDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const fmt = useCurrencyFormatter();
  const requireConfirmation = useSettingsStore((s) => s.confirmBeforeEmergencyWithdrawals);
  const [confirmed, setConfirmed] = useState(!requireConfirmation);
  const [overdraftOpen, setOverdraftOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<EmergencyWithdrawalFormData | null>(null);

  const form = useForm<EmergencyWithdrawalFormData>({
    resolver: zodResolver(emergencyWithdrawalSchema),
    defaultValues: { amount: 0, date: format(new Date(), "yyyy-MM-dd"), reason: "other", note: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ amount: 0, date: format(new Date(), "yyyy-MM-dd"), reason: "other", note: "" });
      setConfirmed(!requireConfirmation);
      setOverdraftOpen(false);
      setPendingValues(null);
    }
  }, [open, requireConfirmation, form]);

  const submitWithdrawal = async (data: EmergencyWithdrawalFormData, overdraftConfirmed: boolean) => {
    if (!fundId) return;
    try {
      await createWithdrawal(
        {
          emergencyFundId: fundId,
          amount: data.amount,
          date: data.date,
          reason: data.reason,
          note: data.note || undefined,
        },
        { confirmed: overdraftConfirmed }
      );
      const newBalance = Math.max(0, currentBalance - data.amount);
      const amountNeededToRestore = Math.max(0, targetAmount - newBalance);
      toast.success(
        amountNeededToRestore > 0
          ? `Emergency fund used: ${fmt(data.amount)} — amount needed to restore target: ${fmt(amountNeededToRestore)}`
          : `Emergency fund used: ${fmt(data.amount)} — you're still at or above your target`
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const onSubmit = async (data: EmergencyWithdrawalFormData) => {
    if (requireConfirmation && !confirmed) {
      toast.error("Please confirm this withdrawal before continuing");
      return;
    }
    if (data.amount > currentBalance) {
      setPendingValues(data);
      setOverdraftOpen(true);
      return;
    }
    await submitWithdrawal(data, false);
  };

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="withdrawAmount">Amount</Label>
        <Input
          id="withdrawAmount"
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
        <Label htmlFor="withdrawDate">Date</Label>
        <Input id="withdrawDate" type="date" {...form.register("date")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="withdrawReason">Reason</Label>
        <Select
          value={form.watch("reason")}
          onValueChange={(v) => form.setValue("reason", v as EmergencyWithdrawalFormData["reason"])}
        >
          <SelectTrigger id="withdrawReason">
            <SelectValue placeholder="Select a reason" />
          </SelectTrigger>
          <SelectContent>
            {emergencyWithdrawalReasons.map((reason) => (
              <SelectItem key={reason} value={reason}>
                {EMERGENCY_WITHDRAWAL_REASON_LABELS[reason]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="withdrawNote">Note (optional)</Label>
        <Textarea id="withdrawNote" rows={2} {...form.register("note")} />
      </div>

      {requireConfirmation && (
        <div className="flex items-start gap-2 rounded-lg border p-3">
          <Checkbox
            id="confirmEmergencyUse"
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked === true)}
          />
          <Label htmlFor="confirmEmergencyUse" className="text-xs font-normal leading-relaxed">
            I&apos;m recording this as an emergency use of these funds.
          </Label>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting || (requireConfirmation && !confirmed)}>
          Record Withdrawal
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Record Withdrawal</DialogTitle>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="pb-8">
            <SheetHeader>
              <SheetTitle>Record Withdrawal</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{formContent}</div>
          </SheetContent>
        </Sheet>
      )}

      <AlertDialog open={overdraftOpen} onOpenChange={setOverdraftOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdrawal exceeds current balance</AlertDialogTitle>
            <AlertDialogDescription>
              This withdrawal is larger than the fund&apos;s current balance. You can still record
              it — this will adjust the balance to reflect the correction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingValues && submitWithdrawal(pendingValues, true)}>
              Confirm Withdrawal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
