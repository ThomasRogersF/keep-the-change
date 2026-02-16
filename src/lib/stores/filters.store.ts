"use client";

import { create } from "zustand";

interface FiltersState {
  search: string;
  setSearch: (s: string) => void;

  dateRange: { from: Date | null; to: Date | null };
  setDateRange: (range: { from: Date | null; to: Date | null }) => void;

  selectedCategories: string[];
  toggleCategory: (id: string) => void;

  selectedAccounts: string[];
  toggleAccount: (id: string) => void;

  amountRange: { min: number | null; max: number | null };
  setAmountRange: (range: { min: number | null; max: number | null }) => void;

  transactionType: "all" | "expense" | "income";
  setTransactionType: (t: "all" | "expense" | "income") => void;

  resetFilters: () => void;
}

const initialState = {
  search: "",
  dateRange: { from: null, to: null },
  selectedCategories: [],
  selectedAccounts: [],
  amountRange: { min: null, max: null },
  transactionType: "all" as const,
};

export const useFiltersStore = create<FiltersState>((set) => ({
  ...initialState,

  setSearch: (search) => set({ search }),
  setDateRange: (dateRange) => set({ dateRange }),

  toggleCategory: (id) =>
    set((state) => ({
      selectedCategories: state.selectedCategories.includes(id)
        ? state.selectedCategories.filter((c) => c !== id)
        : [...state.selectedCategories, id],
    })),

  toggleAccount: (id) =>
    set((state) => ({
      selectedAccounts: state.selectedAccounts.includes(id)
        ? state.selectedAccounts.filter((a) => a !== id)
        : [...state.selectedAccounts, id],
    })),

  setAmountRange: (amountRange) => set({ amountRange }),
  setTransactionType: (transactionType) => set({ transactionType }),
  resetFilters: () => set(initialState),
}));
