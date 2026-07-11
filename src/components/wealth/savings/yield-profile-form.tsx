"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  yieldProfileCreateSchema,
  yieldRateUpdateSchema,
  isUnusuallyHighRate,
  type YieldProfileCreateFormData,
  type YieldRateUpdateFormData,
} from "@/lib/schemas/yield-profile.schema";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { useYieldProfile } from "@/lib/hooks/use-savings";
import { createYieldProfile, updateRate } from "@/lib/services/yield-profile.service";
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

interface YieldProfileFormProps {
  wealthAccountId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function YieldProfileForm({ wealthAccountId, open, onOpenChange }: YieldProfileFormProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const existingProfile = useYieldProfile(wealthAccountId ?? undefined);
  const isEdit = !!existingProfile;

  const createForm = useForm<YieldProfileCreateFormData>({
    resolver: zodResolver(yieldProfileCreateSchema),
    defaultValues: { rateType: "APY", currentRate: 0, effectiveDate: format(new Date(), "yyyy-MM-dd") },
  });

  const updateForm = useForm<YieldRateUpdateFormData>({
    resolver: zodResolver(yieldRateUpdateSchema),
    defaultValues: { rate: 0, effectiveDate: format(new Date(), "yyyy-MM-dd"), note: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (existingProfile) {
      updateForm.reset({
        rate: existingProfile.currentRate,
        effectiveDate: format(new Date(), "yyyy-MM-dd"),
        note: "",
      });
    } else {
      createForm.reset({ rateType: "APY", currentRate: 0, effectiveDate: format(new Date(), "yyyy-MM-dd") });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existingProfile?.id]);

  const onCreate = async (data: YieldProfileCreateFormData) => {
    if (!wealthAccountId) return;
    try {
      await createYieldProfile({ wealthAccountId, ...data });
      toast.success("Yield rate added");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const onUpdate = async (data: YieldRateUpdateFormData) => {
    if (!existingProfile) return;
    try {
      await updateRate({
        profileId: existingProfile.id,
        newRate: data.rate,
        effectiveDate: data.effectiveDate,
        note: data.note || undefined,
      });
      toast.success("Rate updated");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const watchedRate = isEdit ? updateForm.watch("rate") : createForm.watch("currentRate");

  const formContent = isEdit ? (
    <form onSubmit={updateForm.handleSubmit(onUpdate)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newRate">New rate ({existingProfile?.rateType})</Label>
        <Input
          id="newRate"
          type="number"
          step="0.01"
          min="0"
          {...updateForm.register("rate", { valueAsNumber: true })}
        />
        {updateForm.formState.errors.rate && (
          <p className="text-xs text-destructive">{updateForm.formState.errors.rate.message}</p>
        )}
        {isUnusuallyHighRate(watchedRate) && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            That&apos;s an unusually high rate — double check it before saving.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="rateEffectiveDate">Effective date</Label>
        <Input id="rateEffectiveDate" type="date" {...updateForm.register("effectiveDate")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rateNote">Note (optional)</Label>
        <Textarea id="rateNote" rows={2} {...updateForm.register("note")} />
      </div>
      <p className="text-xs text-muted-foreground">
        The previous rate is kept in this account&apos;s rate history.
      </p>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={updateForm.formState.isSubmitting}>
          Update Rate
        </Button>
      </div>
    </form>
  ) : (
    <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rateType">Rate type</Label>
          <Select
            value={createForm.watch("rateType")}
            onValueChange={(v) => createForm.setValue("rateType", v as "APY" | "APR")}
          >
            <SelectTrigger id="rateType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="APY">APY</SelectItem>
              <SelectItem value="APR">APR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentRate">Rate</Label>
          <Input
            id="currentRate"
            type="number"
            step="0.01"
            min="0"
            {...createForm.register("currentRate", { valueAsNumber: true })}
          />
          {createForm.formState.errors.currentRate && (
            <p className="text-xs text-destructive">{createForm.formState.errors.currentRate.message}</p>
          )}
        </div>
      </div>
      {isUnusuallyHighRate(watchedRate) && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          That&apos;s an unusually high rate — double check it before saving.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="createEffectiveDate">Effective date</Label>
        <Input id="createEffectiveDate" type="date" {...createForm.register("effectiveDate")} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={createForm.formState.isSubmitting}>
          Add Yield
        </Button>
      </div>
    </form>
  );

  const title = isEdit ? "Update Rate" : "Add Yield";

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
