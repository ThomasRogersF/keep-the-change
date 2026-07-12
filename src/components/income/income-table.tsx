"use client";

import type { IncomeEntry } from "@/lib/types";
import { useUIStore } from "@/lib/stores/ui.store";
import { useCurrencyFormatter } from "@/lib/hooks/use-currency";
import { db } from "@/lib/db/database";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { StatCard } from "@/components/ui/stat-card";

interface IncomeTableProps {
  entries: IncomeEntry[];
  total: number;
}

export function IncomeTable({ entries, total }: IncomeTableProps) {
  const openModal = useUIStore((s) => s.openModal);
  const fmt = useCurrencyFormatter();

  const handleDelete = async (id: string) => {
    await db.incomeEntries.delete(id);
    toast.success("Income entry deleted");
  };

  return (
    <div className="space-y-4">
      {/* Total card */}
      <StatCard
        label="Total Income"
        value={total}
        icon={DollarSign}
        semanticTone="income"
        variant="emphasis"
      />

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id} className="group">
                <TableCell className="font-medium">{entry.source}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {entry.note || "—"}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums text-success">
                  +{fmt(entry.amount)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openModal("income", "edit", entry.id)}>
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
                            <AlertDialogTitle>Delete income entry?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(entry.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => openModal("income", "edit", entry.id)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border hover:bg-accent/50 transition-colors text-left"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-success/10 text-success shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{entry.source}</p>
              {entry.note && (
                <p className="text-xs text-muted-foreground truncate">{entry.note}</p>
              )}
            </div>
            <span className="font-medium tabular-nums text-sm text-success shrink-0">
              +{fmt(entry.amount)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
