"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  internalTransferSchema,
  type InternalTransferFormData,
} from "@/lib/schemas/internal-transfer.schema";
import { useUIStore } from "@/lib/stores/ui.store";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useAccounts } from "@/lib/hooks/use-accounts";
import { useWealthAccounts } from "@/lib/hooks/use-wealth-accounts";
import { executeInternalTransfer, validateTransfer } from "@/lib/services/internal-transfer.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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

type AccountRefType = "account" | "wealthAccount";

function encodeRef(type: AccountRefType, id: string): string {
  return `${type}:${id}`;
}

function decodeRef(value: string): { type: AccountRefType; id: string } | undefined {
  const [type, ...rest] = value.split(":");
  const id = rest.join(":");
  if ((type === "account" || type === "wealthAccount") && id) {
    return { type, id };
  }
  return undefined;
}

export function InternalTransferDialog() {
  const { activeModal, closeModal } = useUIStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const budgetAccounts = useAccounts() ?? [];
  const wealthAccounts = useWealthAccounts() ?? [];

  const isOpen = activeModal?.type === "internalTransfer";
  const preselectedWealthAccountId = activeModal?.id;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<InternalTransferFormData | null>(null);

  const form = useForm<InternalTransferFormData>({
    resolver: zodResolver(internalTransferSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      amount: 0,
      fromType: "account",
      fromId: "",
      toType: "wealthAccount",
      toId: "",
      note: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        amount: 0,
        fromType: "account",
        fromId: budgetAccounts[0]?.id || "",
        toType: "wealthAccount",
        toId: preselectedWealthAccountId || wealthAccounts[0]?.id || "",
        note: "",
      });
      setConfirmOpen(false);
      setPendingValues(null);
    }
  }, [isOpen, preselectedWealthAccountId]);

  const fromValue = encodeRef(form.watch("fromType"), form.watch("fromId"));
  const toValue = encodeRef(form.watch("toType"), form.watch("toId"));

  const handleRefChange = (field: "from" | "to", value: string) => {
    const decoded = decodeRef(value);
    if (!decoded) return;
    if (field === "from") {
      form.setValue("fromType", decoded.type);
      form.setValue("fromId", decoded.id);
    } else {
      form.setValue("toType", decoded.type);
      form.setValue("toId", decoded.id);
    }
  };

  const submitTransfer = async (data: InternalTransferFormData, confirmed: boolean) => {
    try {
      await executeInternalTransfer(
        { ...data, note: data.note || undefined },
        { confirmInsufficientBalance: confirmed }
      );
      toast.success("Transfer recorded");
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const onSubmit = async (data: InternalTransferFormData) => {
    const validation = await validateTransfer(data);
    if (!validation.valid) {
      form.setError("toId", { message: validation.error });
      toast.error(validation.error ?? "Transfer is invalid");
      return;
    }
    if (validation.requiresConfirmation) {
      setPendingValues(data);
      setConfirmOpen(true);
      return;
    }
    await submitTransfer(data, false);
  };

  const renderAccountOptions = (side: "from" | "to") => (
    <Select value={side === "from" ? fromValue : toValue} onValueChange={(v) => handleRefChange(side, v)}>
      <SelectTrigger>
        <SelectValue placeholder="Select account" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Budget Accounts</SelectLabel>
          {budgetAccounts.map((account) => (
            <SelectItem key={account.id} value={encodeRef("account", account.id)}>
              {account.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Wealth Accounts</SelectLabel>
          {wealthAccounts.map((account) => (
            <SelectItem key={account.id} value={encodeRef("wealthAccount", account.id)}>
              {account.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>From</Label>
        {renderAccountOptions("from")}
      </div>

      <div className="space-y-2">
        <Label>To</Label>
        {renderAccountOptions("to")}
        {form.formState.errors.toId && (
          <p className="text-xs text-destructive">{form.formState.errors.toId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transferAmount">Amount</Label>
          <Input
            id="transferAmount"
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
          <Label htmlFor="transferDate">Date</Label>
          <Input id="transferDate" type="date" {...form.register("date")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transferNote">Note (optional)</Label>
        <Textarea id="transferNote" rows={2} {...form.register("note")} />
      </div>

      <p className="text-xs text-muted-foreground">
        Transfers move money between accounts — they never appear as income or an expense, and
        cross-currency transfers aren&apos;t supported yet.
      </p>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={closeModal}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Transfer
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Internal Transfer</DialogTitle>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeModal()}>
          <SheetContent side="bottom" className="pb-8">
            <SheetHeader>
              <SheetTitle>Internal Transfer</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{formContent}</div>
          </SheetContent>
        </Sheet>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer exceeds tracked balance</AlertDialogTitle>
            <AlertDialogDescription>
              This transfer is larger than the source account&apos;s tracked balance. You can still
              record it — this will adjust the balance to reflect the correction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingValues && submitTransfer(pendingValues, true)}
            >
              Confirm Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
