"use client";

import { create } from "zustand";
import type Lenis from "lenis";

/**
 * Client-only UI state. Never put request/user data here (the module is
 * shared across requests on the server).
 */
interface UIState {
  /** The active Lenis instance, or null (reduced motion / not mounted). */
  lenis: Lenis | null;
  setLenis: (lenis: Lenis | null) => void;

  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  toggleMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  lenis: null,
  setLenis: (lenis) => set({ lenis }),

  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  toggleMenu: () => set((s) => ({ menuOpen: !s.menuOpen })),
}));
