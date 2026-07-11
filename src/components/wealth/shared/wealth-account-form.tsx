"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { wealthAccountSchema, type WealthAccountFormData } from "@/lib/schemas/wealth-account.schema";
import { useUIStore } from "@/lib/stores/ui.store";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { useWealthAccount } from "@/lib/hooks/use-wealth-accounts";
import { useEmergencyFunds } from "@/lib/hooks/use-emergency-funds";
import { wealthAccountRepository } from "@/lib/db/repositories/wealth-account.repository";
import { CURRENCIES } from "@/lib/utils/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

export function WealthAccountForm() {
  const { activeModal, closeModal } = useUIStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const mainCurrency = useSettingsStore((s) => s.currency);
  const defaultWealthCurrency = useSettingsStore((s) => s.defaultWealthCurrency);
  const currency = defaultWealthCurrency || mainCurrency;

  const isOpen = activeModal?.type === "wealthAccount";
  const isEdit = activeModal?.mode === "edit";
  const editId = activeModal?.id;
  const existingAccount = useWealthAccount(isEdit ? editId : undefined);
  const emergencyFunds = useEmergencyFunds() ?? [];

  const isEmergencyLinked = useMemo(
    () => !!editId && emergencyFunds.some((f) => f.wealthAccountId === editId),
    [editId, emergencyFunds]
  );

  const form = useForm<WealthAccountFormData>({
    resolver: zodResolver(wealthAccountSchema),
    defaultValues: {
      name: "",
      type: "cash",
      assetClass: "fiat",
      balance: 0,
      currency,
      institution: "",
      riskLevel: "low",
      liquidity: "immediate",
      insuranceType: "none",
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen && isEdit && existingAccount) {
      form.reset({
        name: existingAccount.name,
        type: existingAccount.type,
        assetClass: existingAccount.assetClass,
        balance: existingAccount.balance,
        currency: existingAccount.currency,
        institution: existingAccount.institution || "",
        riskLevel: existingAccount.riskLevel,
        liquidity: existingAccount.liquidity,
        insuranceType: existingAccount.insuranceType,
        notes: existingAccount.notes || "",
      });
    } else if (isOpen && !isEdit) {
      form.reset({
        name: "",
        type: "cash",
        assetClass: "fiat",
        balance: 0,
        currency,
        institution: "",
        riskLevel: "low",
        liquidity: "immediate",
        insuranceType: "none",
        notes: "",
      });
    }
  }, [isOpen, isEdit, existingAccount, currency, form]);

  const type = form.watch("type");
  const balanceLocked = isEdit && (isEmergencyLinked || type === "brokerage");

  const onSubmit = async (data: WealthAccountFormData) => {
    try {
      const payload = {
        name: data.name,
        type: data.type,
        assetClass: data.assetClass,
        balance: data.balance,
        currency: data.currency,
        institution: data.institution || undefined,
        riskLevel: data.riskLevel,
        liquidity: data.liquidity,
        insuranceType: data.insuranceType,
        notes: data.notes || undefined,
      };
      if (isEdit && editId) {
        const updatePayload = balanceLocked ? { ...payload, balance: existingAccount?.balance ?? 0 } : payload;
        await wealthAccountRepository.update(editId, updatePayload);
        toast.success("Account updated");
      } else {
        await wealthAccountRepository.create({ ...payload, archived: false });
        toast.success("Account created");
      }
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="waName">Account name</Label>
        <Input id="waName" placeholder="e.g. High-Yield Savings" {...form.register("name")} autoFocus />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="waType">Type</Label>
          <Select
            value={form.watch("type")}
            onValueChange={(v) => form.setValue("type", v as WealthAccountFormData["type"])}
            disabled={isEdit}
          >
            <SelectTrigger id="waType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash / Savings</SelectItem>
              <SelectItem value="brokerage">Brokerage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {type === "cash" && (
          <div className="space-y-2">
            <Label htmlFor="waAssetClass">Asset class</Label>
            <Select
              value={form.watch("assetClass")}
              onValueChange={(v) => form.setValue("assetClass", v as WealthAccountFormData["assetClass"])}
            >
              <SelectTrigger id="waAssetClass">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fiat">Fiat</SelectItem>
                <SelectItem value="crypto">Crypto / Stablecoin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="waBalance">{isEdit ? "Balance" : "Opening balance"}</Label>
          <Input
            id="waBalance"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            disabled={balanceLocked}
            {...form.register("balance", { valueAsNumber: true })}
          />
          {balanceLocked && (
            <p className="text-xs text-muted-foreground">
              {type === "brokerage"
                ? "Brokerage cash changes through buys, sells, and transfers."
                : "This account is linked to an Emergency Fund — record a contribution or withdrawal instead."}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="waCurrency">Currency</Label>
          <Select value={form.watch("currency")} onValueChange={(v) => form.setValue("currency", v)}>
            <SelectTrigger id="waCurrency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="waInstitution">Institution (optional)</Label>
        <Input id="waInstitution" placeholder="e.g. Fidelity" {...form.register("institution")} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="waRisk">Risk</Label>
          <Select
            value={form.watch("riskLevel")}
            onValueChange={(v) => form.setValue("riskLevel", v as WealthAccountFormData["riskLevel"])}
          >
            <SelectTrigger id="waRisk">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Moderate</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="waLiquidity">Liquidity</Label>
          <Select
            value={form.watch("liquidity")}
            onValueChange={(v) => form.setValue("liquidity", v as WealthAccountFormData["liquidity"])}
          >
            <SelectTrigger id="waLiquidity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Available Anytime</SelectItem>
              <SelectItem value="short_term">Flexible</SelectItem>
              <SelectItem value="long_term">Locked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="waInsurance">Insurance</Label>
          <Select
            value={form.watch("insuranceType")}
            onValueChange={(v) => form.setValue("insuranceType", v as WealthAccountFormData["insuranceType"])}
          >
            <SelectTrigger id="waInsurance">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FDIC">FDIC</SelectItem>
              <SelectItem value="NCUA">NCUA</SelectItem>
              <SelectItem value="SIPC">SIPC</SelectItem>
              <SelectItem value="none">Uninsured</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="waNotes">Notes (optional)</Label>
        <Textarea id="waNotes" rows={2} {...form.register("notes")} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={closeModal}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {isEdit ? "Update" : "Add Account"}
        </Button>
      </div>
    </form>
  );

  const title = isEdit ? "Edit Wealth Account" : "New Wealth Account";

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-lg">
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
      <SheetContent side="bottom" className="pb-8 max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">{formContent}</div>
      </SheetContent>
    </Sheet>
  );
}
