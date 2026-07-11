"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  manualPriceUpdateSchema,
  type ManualPriceUpdateFormData,
} from "@/lib/schemas/asset-holding.schema";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { recordManualPriceUpdate } from "@/lib/services/investment.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssetHolding } from "@/lib/types";

interface ManualPriceUpdateDialogProps {
  holding: AssetHolding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualPriceUpdateDialog({ holding, open, onOpenChange }: ManualPriceUpdateDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const form = useForm<ManualPriceUpdateFormData>({
    resolver: zodResolver(manualPriceUpdateSchema),
    defaultValues: { pricePerUnit: 0 },
  });

  useEffect(() => {
    if (open && holding) {
      form.reset({ pricePerUnit: holding.currentPricePerUnit });
    }
  }, [open, holding, form]);

  const onSubmit = async (data: ManualPriceUpdateFormData) => {
    if (!holding) return;
    try {
      await recordManualPriceUpdate({
        wealthAccountId: holding.wealthAccountId,
        assetHoldingId: holding.id,
        pricePerUnit: data.pricePerUnit,
        date: format(new Date(), "yyyy-MM-dd"),
      });
      toast.success("Price updated");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPrice">New price per unit</Label>
        <Input
          id="newPrice"
          type="number"
          step="0.01"
          min="0"
          autoFocus
          {...form.register("pricePerUnit", { valueAsNumber: true })}
        />
        {form.formState.errors.pricePerUnit && (
          <p className="text-xs text-destructive">{form.formState.errors.pricePerUnit.message}</p>
        )}
      </div>
      {holding?.priceUpdatedAt && (
        <p className="text-xs text-muted-foreground">
          Last updated {holding.priceUpdatedAt.toLocaleDateString()}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Update Price
        </Button>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Price — {holding?.symbol}</DialogTitle>
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
          <SheetTitle>Update Price — {holding?.symbol}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">{formContent}</div>
      </SheetContent>
    </Sheet>
  );
}
