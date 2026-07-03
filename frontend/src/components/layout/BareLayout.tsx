import { Outlet } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * Chrome-free layout (ARCHITECTURE §7.2). No sidebar/header — just a centered
 * content column. This is the frame for the future auth (sign-in/sign-up) and
 * quiz-answering pages, which must not show the app shell. Rendered by the
 * pathless `_bare` layout route.
 */
export function BareLayout(): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
      <main className="w-full max-w-md">
        <Outlet />
      </main>
    </div>
  );
}
