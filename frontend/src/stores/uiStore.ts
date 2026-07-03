import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * UI store (ARCHITECTURE §7.3). Minimal client-UI state persisted to
 * localStorage. For now it only holds the sidebar collapse flag so the
 * expanded/collapsed choice survives reloads. Theme state deliberately stays in
 * lib/theme.ts (anti-FOUC-synced) — see TICKET-005 notes.
 */
interface UiState {
  // Whether the sidebar is collapsed to its icons-only rail.
  sidebarCollapsed: boolean;
  // Flip the collapsed state.
  toggleSidebar: () => void;
  // Set the collapsed state explicitly.
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      // Distinct key from `qc-theme` so UI + theme persistence stay independent.
      name: "qc-ui",
      // Persist only the minimal serializable slice.
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
