"use client";

import { useCallback } from "react";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { formatCurrency } from "@/lib/utils/format";

export function useCurrencyFormatter() {
  const { currency, currencyLocale } = useSettingsStore();

  return useCallback(
    (amount: number) => formatCurrency(amount, currency, currencyLocale),
    [currency, currencyLocale]
  );
}
