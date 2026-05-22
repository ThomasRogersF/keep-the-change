"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryFormData } from "@/lib/schemas/category.schema";
import { categoryRepository } from "@/lib/db/repositories/category.repository";
import { useUIStore } from "@/lib/stores/ui.store";
import { ICON_OPTIONS, COLOR_OPTIONS } from "@/lib/utils/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DynamicIcon } from "@/components/shared/dynamic-icon";

export function CategoryForm() {
  const { activeModal, closeModal } = useUIStore();

  const isOpen = activeModal?.type === "category";
  const isEdit = activeModal?.mode === "edit";
  const editId = activeModal?.id;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      icon: "Home",
      colorToken: "chart-1",
    },
  });

  const watchedName = form.watch("name");
  const watchedIcon = form.watch("icon");
  const watchedColor = form.watch("colorToken");

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && editId) {
      categoryRepository.getById(editId).then((cat) => {
        if (cat) {
          form.reset({
            name: cat.name,
            icon: cat.icon,
            colorToken: cat.colorToken,
          });
        }
      });
    } else {
      form.reset({
        name: "",
        icon: "Home",
        colorToken: "chart-1",
      });
    }
  }, [isOpen, isEdit, editId, form]);

  const onSubmit = async (data: CategoryFormData) => {
    const trimmed = data.name.trim();
    try {
      const existing = await categoryRepository.getByName(trimmed);
      if (existing && existing.id !== editId) {
        form.setError("name", {
          type: "manual",
          message: "A category with this name already exists",
        });
        return;
      }

      const payload = {
        name: trimmed,
        icon: data.icon,
        colorToken: data.colorToken,
      };

      if (isEdit && editId) {
        await categoryRepository.update(editId, payload);
        toast.success("Category updated");
      } else {
        await categoryRepository.create(payload);
        toast.success("Category created");
      }
      closeModal();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const previewName = watchedName.trim() || "New category";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Live preview */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
              style={{
                backgroundColor: `color-mix(in srgb, var(--color-${watchedColor}) 14%, transparent)`,
                color: `var(--color-${watchedColor})`,
              }}
            >
              <DynamicIcon name={watchedIcon} className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{previewName}</p>
              <p className="text-xs text-muted-foreground">Preview</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Groceries"
              autoComplete="off"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-5 gap-2">
              {ICON_OPTIONS.map((iconName) => {
                const selected = watchedIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() =>
                      form.setValue("icon", iconName, { shouldDirty: true })
                    }
                    aria-label={iconName}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center justify-center h-10 rounded-md border transition-colors",
                      "hover:bg-muted",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    <DynamicIcon name={iconName} className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-3">
              {COLOR_OPTIONS.map((color) => {
                const selected = watchedColor === color.token;
                return (
                  <button
                    key={color.token}
                    type="button"
                    onClick={() =>
                      form.setValue("colorToken", color.token, {
                        shouldDirty: true,
                      })
                    }
                    aria-label={color.label}
                    aria-pressed={selected}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform",
                      "hover:scale-110",
                      selected
                        ? "ring-2 ring-offset-2 ring-foreground ring-offset-background"
                        : "ring-1 ring-border"
                    )}
                    style={{ backgroundColor: `var(--color-${color.token})` }}
                  />
                );
              })}
            </div>
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
