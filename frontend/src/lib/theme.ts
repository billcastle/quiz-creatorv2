import { DEFAULT_THEME, THEMES, type ThemeKey } from "@/themes/manifest";

/**
 * Theme mechanism (ADR-010). Applies the active theme and persists the choice
 * to localStorage. Two mechanisms, kept in lockstep with the anti-FOUC inline
 * script in index.html (same `qc-theme` key):
 *   - the built-in light/dark pair toggles the `.dark` class on <html>;
 *   - any additional NAMED theme (registered in themes/manifest.ts) is applied
 *     via a `data-theme="<key>"` attribute on <html>.
 * Only light + dark ship today, so the `[data-theme]` path is wired and ready
 * but currently drives no extra token file — adding a theme .css + manifest
 * entry makes it live with no further code here.
 */
const STORAGE_KEY = "qc-theme";

// The built-in pair handled purely by the `.dark` class (no data-theme needed).
const BUILT_IN_THEMES: readonly ThemeKey[] = ["light", "dark"];

export function getStoredTheme(): ThemeKey {
  const stored = localStorage.getItem(STORAGE_KEY);
  // Validate against the manifest keys, not a hard-coded literal union.
  const isKnown = THEMES.some((t) => t.key === stored);
  return isKnown ? (stored as ThemeKey) : DEFAULT_THEME;
}

export function applyTheme(theme: ThemeKey): void {
  const root = document.documentElement;

  // Light/dark pair rides on the `.dark` class.
  root.classList.toggle("dark", theme === "dark");

  // Named (non-built-in) themes ride on the `data-theme` attribute; built-ins
  // clear it so the default token set applies.
  if (BUILT_IN_THEMES.includes(theme)) {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }

  localStorage.setItem(STORAGE_KEY, theme);
}

/** Read the persisted theme and apply it. Call once on app boot. */
export function initTheme(): void {
  applyTheme(getStoredTheme());
}
