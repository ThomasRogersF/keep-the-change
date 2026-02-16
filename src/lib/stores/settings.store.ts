"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format } from "date-fns";

interface SettingsState {
  currency: string;
  currencyLocale: string;
  setCurrency: (code: string, locale: string) => void;

  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: "USD",
      currencyLocale: "en-US",
      setCurrency: (currency, currencyLocale) =>
        set({ currency, currencyLocale }),

      selectedMonth: format(new Date(), "yyyy-MM"),
      setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
    }),
    {
      name: "ledgerly-settings",
      partialize: (state) => ({
        currency: state.currency,
        currencyLocale: state.currencyLocale,
      }),
    }
  )
);
