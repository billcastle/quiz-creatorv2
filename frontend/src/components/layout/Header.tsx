import { Moon, Sun } from "lucide-react";
import { type ReactElement, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { THEMES, type ThemeKey } from "@/themes/manifest";

/**
 * Top header (FR-39). Left: the app wordmark. Top-right: a fast light/dark
 * toggle plus a data-driven custom-theme dropdown (built with the existing
 * shadcn Select — no DropdownMenu dep). Both controls read/write the SAME theme
 * state via lib/theme.ts (.dark class + optional data-theme + `qc-theme`), so
 * they stay in sync. The dropdown enumerates themes/manifest.ts THEMES, so
 * adding a manifest entry adds an option with no further code.
 */
export function Header(): ReactElement {
  // Local mirror of the persisted theme so both controls reflect the same value.
  const [theme, setThemeState] = useState<ThemeKey>(getStoredTheme);

  // Re-read on mount in case another surface applied a theme first.
  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  const changeTheme = useCallback((next: ThemeKey) => {
    applyTheme(next);
    setThemeState(next);
  }, []);

  const isDark = theme === "dark";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-border border-b bg-background px-4">
      {/* Wordmark */}
      <span className="font-semibold text-base tracking-tight">
        Questionnaire Creator
      </span>

      {/* Top-right control cluster */}
      <div className="flex items-center gap-2">
        {/* Fast light/dark toggle. */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => changeTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDark ? <Moon aria-hidden /> : <Sun aria-hidden />}
        </Button>

        {/* Full custom-theme dropdown, data-driven from THEMES. */}
        <Select
          value={theme}
          onValueChange={(next) => changeTheme(next as ThemeKey)}
        >
          <SelectTrigger className="w-[140px]" aria-label="Select theme">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEMES.map((t) => (
              <SelectItem key={t.key} value={t.key}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
