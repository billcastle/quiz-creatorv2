import { DEFAULT_THEME, type ThemeKey } from "@/themes/manifest";

/**
 * Minimal theme mechanism (ADR-010). Applies the active theme by toggling the
 * `.dark` class on <html> and persists the choice to localStorage. No switcher
 * UI here — that is deferred to the header/design-system ticket. This is the
 * "tiny provider" option from the ticket (Zustand themeStore lands later).
 */
const STORAGE_KEY = "qc-theme";

export function getStoredTheme(): ThemeKey {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : DEFAULT_THEME;
}

export function applyTheme(theme: ThemeKey): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  localStorage.setItem(STORAGE_KEY, theme);
}

/** Read the persisted theme and apply it. Call once on app boot. */
export function initTheme(): void {
  applyTheme(getStoredTheme());
}
