"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import type { Category } from "@/lib/types";
import { useUIStore } from "@/lib/stores/ui.store";
import { db } from "@/lib/db/database";
import { categoryRepository } from "@/lib/db/repositories/category.repository";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CategoryListProps {
  categories: Category[];
}

function useCategoryUsage(): Record<string, { tx: number; sub: number }> {
  const counts = useLiveQuery(
    async () => {
      const [txs, subs] = await Promise.all([
        db.transactions.toArray(),
        db.subscriptions.toArray(),
      ]);
      const map: Record<string, { tx: number; sub: number }> = {};
      for (const t of txs) {
        if (t.deletedAt || !t.categoryId) continue;
        map[t.categoryId] = map[t.categoryId] ?? { tx: 0, sub: 0 };
        map[t.categoryId].tx += 1;
      }
      for (const s of subs) {
        if (s.deletedAt || !s.categoryId) continue;
        map[s.categoryId] = map[s.categoryId] ?? { tx: 0, sub: 0 };
        map[s.categoryId].sub += 1;
      }
      return map;
    },
    [],
    {} as Record<string, { tx: number; sub: number }>
  );
  return counts ?? {};
}

export function CategoryList({ categories }: CategoryListProps) {
  const openModal = useUIStore((s) => s.openModal);
  const usage = useCategoryUsage();

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const handleDelete = async (id: string) => {
    const u = usage[id] ?? { tx: 0, sub: 0 };
    if (u.tx + u.sub > 0) {
      const parts: string[] = [];
      if (u.tx > 0) parts.push(`${u.tx} transaction${u.tx === 1 ? "" : "s"}`);
      if (u.sub > 0) parts.push(`${u.sub} subscription${u.sub === 1 ? "" : "s"}`);
      toast.error(`Cannot delete: ${parts.join(" and ")} use this category`);
      return;
    }
    await categoryRepository.delete(id);
    toast.success("Category deleted");
  };

  return (
    <div className="space-y-2">
      {sorted.map((category) => {
        const u = usage[category.id];
        const total = (u?.tx ?? 0) + (u?.sub ?? 0);
        return (
          <Card key={category.id} className="group">
            <CardContent className="flex items-center gap-4 py-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--color-${category.colorToken}) 14%, transparent)`,
                  color: `var(--color-${category.colorToken})`,
                }}
              >
                <DynamicIcon name={category.icon} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{category.name}</p>
                {total > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {total} {total === 1 ? "use" : "uses"}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Unused</p>
                )}
              </div>
              {total > 0 && (
                <Badge variant="secondary" className="text-xs font-normal shrink-0">
                  {total}
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shrink-0"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => openModal("category", "edit", category.id)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete &ldquo;{category.name}&rdquo;?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {total > 0
                            ? `This category is used by ${total} ${total === 1 ? "item" : "items"}. Reassign them before deleting.`
                            : "This category will be removed. You can recreate it any time."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(category.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
