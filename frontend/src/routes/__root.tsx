import { Outlet, createRootRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * Pass-through root route (TICKET-005). It renders ONLY <Outlet /> plus any
 * future app-global providers — the layout choice now lives one level down in
 * the pathless `_app` (AppLayout: sidebar + header) and `_bare` (BareLayout:
 * chrome-free) layout routes per ARCHITECTURE §7.1 / §7.2.
 */
export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent(): ReactElement {
  return <Outlet />;
}
