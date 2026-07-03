import { Outlet } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * Minimal application shell. The full collapsible sidebar + header (with the
 * theme switcher and account menu) land in a later FE-shell ticket
 * (ARCHITECTURE §7.2). For now it just hosts routed content via <Outlet />.
 */
export function AppLayout(): ReactElement {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
