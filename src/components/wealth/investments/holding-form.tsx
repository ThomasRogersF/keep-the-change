"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { assetHoldingSchema, type AssetHoldingFormData } from "@/lib/schemas/asset-holding.schema";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { assetHoldingRepository } from "@/lib/db/repositories/asset-holding.repository";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

interface HoldingFormProps {
  wealthAccountId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (holdingId: string) => void;
}

export function HoldingForm({ wealthAccountId, open, onOpenChange, onCreated }: HoldingFormProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const form = useForm<AssetHoldingFormData>({
    resolver: zodResolver(assetHoldingSchema),
    defaultValues: {
      wealthAccountId: wealthAccountId ?? "",
      assetType: "etf",
      symbol: "",
      name: "",
      currentPricePerUnit: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        wealthAccountId: wealthAccountId ?? "",
        assetType: "etf",
        symbol: "",
        name: "",
        currentPricePerUnit: 0,
      });
    }
  }, [open, wealthAccountId, form]);

  const onSubmit = async (data: AssetHoldingFormData) => {
    if (!data.wealthAccountId) {
      toast.error("Select a brokerage account first");
      return;
    }
    try {
      const id = await assetHoldingRepository.create({
        wealthAccountId: data.wealthAccountId,
        assetType: data.assetType,
        symbol: data.symbol,
        name: data.name || undefined,
        quantity: 0,
        costBasisTotal: 0,
        currentPricePerUnit: data.currentPricePerUnit,
        priceUpdatedAt: new Date(),
      });
      toast.success("Holding created");
      onOpenChange(false);
      onCreated?.(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="holdingSymbol">Symbol</Label>
          <Input id="holdingSymbol" placeholder="e.g. VOO" {...form.register("symbol")} autoFocus />
          {form.formState.errors.symbol && (
            <p className="text-xs text-destructive">{form.formState.errors.symbol.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="holdingType">Type</Label>
          <Select
            value={form.watch("assetType")}
            onValueChange={(v) => form.setValue("assetType", v as AssetHoldingFormData["assetType"])}
          >
            <SelectTrigger id="holdingType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="etf">ETF</SelectItem>
              <SelectItem value="stock">Stock</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="holdingName">Name (optional)</Label>
        <Input id="holdingName" placeholder="e.g. Vanguard S&P 500 ETF" {...form.register("name")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="holdingPrice">Current price per unit</Label>
        <Input
          id="holdingPrice"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...form.register("currentPricePerUnit", { valueAsNumber: true })}
        />
        {form.formState.errors.currentPricePerUnit && (
          <p className="text-xs text-destructive">{form.formState.errors.currentPricePerUnit.message}</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        This creates the holding with zero quantity — log a buy next to record your position.
      </p>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Create Holding
        </Button>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Holding</DialogTitle>
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
          <SheetTitle>New Holding</SheetTitle>
        </SheetHeader>
        <div className="mt-4">{formContent}</div>
      </SheetContent>
    </Sheet>
  );
}
