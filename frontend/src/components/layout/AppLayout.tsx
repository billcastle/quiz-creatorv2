import { Outlet } from "@tanstack/react-router";
import type { ReactElement } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

/**
 * Application shell (ARCHITECTURE §7.2). Persistent left Sidebar + top Header +
 * a scrollable main content region hosting the routed <Outlet/>. Every app
 * feature page renders inside this frame (via the pathless `_app` layout route).
 */
export function AppLayout(): ReactElement {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-3xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
