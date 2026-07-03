import { AppLayout } from "@/components/layout/AppLayout";
import { createRootRoute } from "@tanstack/react-router";

/**
 * Root route. Renders the minimal AppLayout shell for every route.
 *
 * Future routes are added as sibling files in src/routes/ (file-based codegen
 * regenerates routeTree.gen.ts). The `/design-system` gallery ticket adds a
 * `design-system.tsx` here next; auth/answering routes will introduce the
 * `_app` / `_bare` layout groups per ARCHITECTURE §7.2.
 */
export const Route = createRootRoute({
  component: AppLayout,
});
