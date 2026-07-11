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

  subtractGoalsFromAvailable: boolean;
  setSubtractGoalsFromAvailable: (v: boolean) => void;

  syncEnabled: boolean;
  setSyncEnabled: (v: boolean) => void;

  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (v: boolean) => void;

  // ─── Wealth module ──────────────────────────────────────
  defaultWealthCurrency: string;
  setDefaultWealthCurrency: (currency: string) => void;

  emergencyFundsCountAsLiquid: boolean;
  setEmergencyFundsCountAsLiquid: (v: boolean) => void;

  showInvestmentGainsOnDashboard: boolean;
  setShowInvestmentGainsOnDashboard: (v: boolean) => void;

  includeEstimatedInterestInProjections: boolean;
  setIncludeEstimatedInterestInProjections: (v: boolean) => void;

  countConfirmedInterestAsIncome: boolean;
  setCountConfirmedInterestAsIncome: (v: boolean) => void;

  showCryptoAssets: boolean;
  setShowCryptoAssets: (v: boolean) => void;

  confirmBeforeEmergencyWithdrawals: boolean;
  setConfirmBeforeEmergencyWithdrawals: (v: boolean) => void;

  showWealthWidgetOnDashboard: boolean;
  setShowWealthWidgetOnDashboard: (v: boolean) => void;
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

      subtractGoalsFromAvailable: false,
      setSubtractGoalsFromAvailable: (subtractGoalsFromAvailable) =>
        set({ subtractGoalsFromAvailable }),

      syncEnabled: false,
      setSyncEnabled: (syncEnabled) => set({ syncEnabled }),

      autoSyncEnabled: true,
      setAutoSyncEnabled: (autoSyncEnabled) => set({ autoSyncEnabled }),

      defaultWealthCurrency: "",
      setDefaultWealthCurrency: (defaultWealthCurrency) => set({ defaultWealthCurrency }),

      emergencyFundsCountAsLiquid: true,
      setEmergencyFundsCountAsLiquid: (emergencyFundsCountAsLiquid) =>
        set({ emergencyFundsCountAsLiquid }),

      showInvestmentGainsOnDashboard: true,
      setShowInvestmentGainsOnDashboard: (showInvestmentGainsOnDashboard) =>
        set({ showInvestmentGainsOnDashboard }),

      includeEstimatedInterestInProjections: true,
      setIncludeEstimatedInterestInProjections: (includeEstimatedInterestInProjections) =>
        set({ includeEstimatedInterestInProjections }),

      countConfirmedInterestAsIncome: false,
      setCountConfirmedInterestAsIncome: (countConfirmedInterestAsIncome) =>
        set({ countConfirmedInterestAsIncome }),

      showCryptoAssets: true,
      setShowCryptoAssets: (showCryptoAssets) => set({ showCryptoAssets }),

      confirmBeforeEmergencyWithdrawals: true,
      setConfirmBeforeEmergencyWithdrawals: (confirmBeforeEmergencyWithdrawals) =>
        set({ confirmBeforeEmergencyWithdrawals }),

      showWealthWidgetOnDashboard: true,
      setShowWealthWidgetOnDashboard: (showWealthWidgetOnDashboard) =>
        set({ showWealthWidgetOnDashboard }),
    }),
    {
      name: "ledgerly-settings",
      partialize: (state) => ({
        currency: state.currency,
        currencyLocale: state.currencyLocale,
        subtractGoalsFromAvailable: state.subtractGoalsFromAvailable,
        syncEnabled: state.syncEnabled,
        autoSyncEnabled: state.autoSyncEnabled,
        defaultWealthCurrency: state.defaultWealthCurrency,
        emergencyFundsCountAsLiquid: state.emergencyFundsCountAsLiquid,
        showInvestmentGainsOnDashboard: state.showInvestmentGainsOnDashboard,
        includeEstimatedInterestInProjections: state.includeEstimatedInterestInProjections,
        countConfirmedInterestAsIncome: state.countConfirmedInterestAsIncome,
        showCryptoAssets: state.showCryptoAssets,
        confirmBeforeEmergencyWithdrawals: state.confirmBeforeEmergencyWithdrawals,
        showWealthWidgetOnDashboard: state.showWealthWidgetOnDashboard,
      }),
    }
  )
);
