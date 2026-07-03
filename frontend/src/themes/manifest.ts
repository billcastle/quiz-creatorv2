/**
 * Theme manifest (ADR-010). Registers the available themes so the theme
 * mechanism and any future switcher UI can enumerate them. Adding a theme =
 * add a token file (src/themes/<name>.css) + a `data-theme` block (or the
 * `.dark` class for the built-in dark pair) + an entry here.
 */

// Built-in light/dark pair uses shadcn's `.dark` class toggle on <html>.
export type ThemeKey = "light" | "dark";

export interface ThemeMeta {
  key: ThemeKey;
  label: string;
}

export const THEMES: readonly ThemeMeta[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
] as const;

export const DEFAULT_THEME: ThemeKey = "light";
