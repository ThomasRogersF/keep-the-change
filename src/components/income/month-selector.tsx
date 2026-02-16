"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, parse } from "date-fns";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { Button } from "@/components/ui/button";
import { formatMonthLabel } from "@/lib/utils/format";

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useSettingsStore();

  const goToPrev = () => {
    const date = parse(selectedMonth, "yyyy-MM", new Date());
    setSelectedMonth(format(subMonths(date, 1), "yyyy-MM"));
  };

  const goToNext = () => {
    const date = parse(selectedMonth, "yyyy-MM", new Date());
    setSelectedMonth(format(addMonths(date, 1), "yyyy-MM"));
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(format(new Date(), "yyyy-MM"));
  };

  const isCurrentMonth = selectedMonth === format(new Date(), "yyyy-MM");

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrev}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <button
        onClick={goToCurrentMonth}
        className="text-sm font-medium min-w-[140px] text-center hover:text-primary transition-colors"
        title="Click to go to current month"
      >
        {formatMonthLabel(selectedMonth)}
      </button>
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNext}>
        <ChevronRight className="w-4 h-4" />
      </Button>
      {!isCurrentMonth && (
        <Button variant="ghost" size="sm" onClick={goToCurrentMonth} className="text-xs">
          Today
        </Button>
      )}
    </div>
  );
}
