"use client";

import { create } from "zustand";

type ModalType = "transaction" | "subscription" | "income" | "account" | "category" | null;

interface ModalState {
  type: ModalType;
  mode: "create" | "edit";
  id?: string;
}

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  activeModal: ModalState | null;
  openModal: (type: ModalType, mode: "create" | "edit", id?: string) => void;
  closeModal: () => void;

  mobileAddOpen: boolean;
  setMobileAddOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  activeModal: null,
  openModal: (type, mode, id) => set({ activeModal: { type, mode, id } }),
  closeModal: () => set({ activeModal: null }),

  mobileAddOpen: false,
  setMobileAddOpen: (open) => set({ mobileAddOpen: open }),
}));
