"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema, type AccountFormData } from "@/lib/schemas/account.schema";
import { db } from "@/lib/db/database";
import { useUIStore } from "@/lib/stores/ui.store";
import { CURRENCIES } from "@/lib/utils/constants";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function AccountForm() {
  const { activeModal, closeModal } = useUIStore();

  const isOpen = activeModal?.type === "account";
  const isEdit = activeModal?.mode === "edit";
  const editId = activeModal?.id;

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "main",
      currency: "USD",
    },
  });

  useEffect(() => {
    if (isOpen && isEdit && editId) {
      db.accounts.get(editId).then((acct) => {
        if (acct) {
          form.reset({
            name: acct.name,
            type: acct.type,
            currency: acct.currency,
          });
        }
      });
    } else if (isOpen && !isEdit) {
      form.reset({
        name: "",
        type: "main",
        currency: "USD",
      });
    }
  }, [isOpen, isEdit, editId, form]);

  const onSubmit = async (data: AccountFormData) => {
    try {
      if (isEdit && editId) {
        await db.accounts.update(editId, data);
        toast.success("Account updated");
      } else {
        await db.accounts.add({
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date(),
        });
        toast.success("Account created");
      }
      closeModal();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Account" : "Add Account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acct-name">Name</Label>
            <Input
              id="acct-name"
              placeholder="e.g. Checking Account"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="acct-type">Type</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(v) => form.setValue("type", v as "main" | "external")}
            >
              <SelectTrigger id="acct-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main (Budget)</SelectItem>
                <SelectItem value="external">External (Investments/Savings)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {form.watch("type") === "main"
                ? "Main accounts contribute to your budget totals."
                : "External accounts are tracked separately from your budget."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acct-currency">Currency</Label>
            <Select
              value={form.watch("currency")}
              onValueChange={(v) => form.setValue("currency", v)}
            >
              <SelectTrigger id="acct-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
