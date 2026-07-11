"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  investmentActivitySchema,
  type InvestmentActivityFormData,
} from "@/lib/schemas/investment-activity.schema";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import {
  executeBuy,
  executeSell,
  recordDividend,
  recordFee,
  recordManualPriceUpdate,
} from "@/lib/services/investment.service";
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
import type { AssetHolding } from "@/lib/types";

interface InvestmentActivityFormProps {
  wealthAccountId: string | null;
  holdings: AssetHolding[];
  defaultHoldingId?: string;
  defaultType?: InvestmentActivityFormData["type"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIVITY_TYPE_LABELS: Record<InvestmentActivityFormData["type"], string> = {
  buy: "Buy",
  sell: "Sell",
  dividend: "Dividend",
  fee: "Fee",
  priceUpdate: "Price Update",
};

export function InvestmentActivityForm({
  wealthAccountId,
  holdings,
  defaultHoldingId,
  defaultType,
  open,
  onOpenChange,
}: InvestmentActivityFormProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const fmt = useCurrencyFormatter();

  const form = useForm<InvestmentActivityFormData>({
    resolver: zodResolver(investmentActivitySchema),
    defaultValues: {
      type: defaultType ?? "buy",
      date: format(new Date(), "yyyy-MM-dd"),
      assetHoldingId: defaultHoldingId ?? holdings[0]?.id ?? "",
      quantity: undefined,
      pricePerUnit: undefined,
      amount: undefined,
      note: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        type: defaultType ?? "buy",
        date: format(new Date(), "yyyy-MM-dd"),
        assetHoldingId: defaultHoldingId ?? holdings[0]?.id ?? "",
        quantity: undefined,
        pricePerUnit: undefined,
        amount: undefined,
        note: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultHoldingId, defaultType]);

  const type = form.watch("type");
  const needsHolding = type === "buy" || type === "sell" || type === "priceUpdate";
  const needsQuantityAndPrice = type === "buy" || type === "sell";
  const needsAmount = type === "dividend" || type === "fee";

  const onSubmit = async (data: InvestmentActivityFormData) => {
    if (!wealthAccountId) return;
    try {
      if (data.type === "buy") {
        await executeBuy({
          wealthAccountId,
          assetHoldingId: data.assetHoldingId!,
          quantity: data.quantity!,
          pricePerUnit: data.pricePerUnit!,
          date: data.date,
          note: data.note || undefined,
        });
        toast.success("Buy recorded");
      } else if (data.type === "sell") {
        const result = await executeSell({
          wealthAccountId,
          assetHoldingId: data.assetHoldingId!,
          quantity: data.quantity!,
          pricePerUnit: data.pricePerUnit!,
          date: data.date,
          note: data.note || undefined,
        });
        const gainLabel = result.realizedGain >= 0 ? "gain" : "loss";
        toast.success(`Sell recorded — realized ${gainLabel} of ${fmt(Math.abs(result.realizedGain))}`);
      } else if (data.type === "dividend") {
        await recordDividend({
          wealthAccountId,
          assetHoldingId: data.assetHoldingId || undefined,
          amount: data.amount!,
          date: data.date,
          note: data.note || undefined,
        });
        toast.success("Dividend recorded");
      } else if (data.type === "fee") {
        await recordFee({
          wealthAccountId,
          assetHoldingId: data.assetHoldingId || undefined,
          amount: data.amount!,
          date: data.date,
          note: data.note || undefined,
        });
        toast.success("Fee recorded");
      } else if (data.type === "priceUpdate") {
        await recordManualPriceUpdate({
          wealthAccountId,
          assetHoldingId: data.assetHoldingId!,
          pricePerUnit: data.pricePerUnit!,
          date: data.date,
        });
        toast.success("Price updated");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="activityType">Activity type</Label>
        <Select
          value={type}
          onValueChange={(v) => form.setValue("type", v as InvestmentActivityFormData["type"])}
        >
          <SelectTrigger id="activityType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ACTIVITY_TYPE_LABELS) as InvestmentActivityFormData["type"][]).map((t) => (
              <SelectItem key={t} value={t}>
                {ACTIVITY_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {needsHolding && (
        <div className="space-y-2">
          <Label htmlFor="activityHolding">Holding</Label>
          <Select
            value={form.watch("assetHoldingId")}
            onValueChange={(v) => form.setValue("assetHoldingId", v)}
          >
            <SelectTrigger id="activityHolding">
              <SelectValue placeholder="Select holding" />
            </SelectTrigger>
            <SelectContent>
              {holdings.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.assetHoldingId && (
            <p className="text-xs text-destructive">{form.formState.errors.assetHoldingId.message}</p>
          )}
        </div>
      )}

      {needsQuantityAndPrice && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="activityQuantity">Quantity</Label>
            <Input
              id="activityQuantity"
              type="number"
              step="0.000001"
              min="0"
              {...form.register("quantity", { valueAsNumber: true })}
            />
            {form.formState.errors.quantity && (
              <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="activityPrice">Price per unit</Label>
            <Input
              id="activityPrice"
              type="number"
              step="0.01"
              min="0"
              {...form.register("pricePerUnit", { valueAsNumber: true })}
            />
            {form.formState.errors.pricePerUnit && (
              <p className="text-xs text-destructive">{form.formState.errors.pricePerUnit.message}</p>
            )}
          </div>
        </div>
      )}

      {type === "priceUpdate" && (
        <div className="space-y-2">
          <Label htmlFor="activityPriceOnly">New price per unit</Label>
          <Input
            id="activityPriceOnly"
            type="number"
            step="0.01"
            min="0"
            {...form.register("pricePerUnit", { valueAsNumber: true })}
          />
          {form.formState.errors.pricePerUnit && (
            <p className="text-xs text-destructive">{form.formState.errors.pricePerUnit.message}</p>
          )}
        </div>
      )}

      {needsAmount && (
        <div className="space-y-2">
          <Label htmlFor="activityAmount">Amount</Label>
          <Input
            id="activityAmount"
            type="number"
            step="0.01"
            min="0"
            {...form.register("amount", { valueAsNumber: true })}
          />
          {form.formState.errors.amount && (
            <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="activityDate">Date</Label>
        <Input id="activityDate" type="date" {...form.register("date")} />
      </div>

      {type !== "priceUpdate" && (
        <div className="space-y-2">
          <Label htmlFor="activityNote">Note (optional)</Label>
          <Textarea id="activityNote" rows={2} {...form.register("note")} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Investment Activity</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="pb-8 max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log Investment Activity</SheetTitle>
        </SheetHeader>
        <div className="mt-4">{formContent}</div>
      </SheetContent>
    </Sheet>
  );
}
