import { AppLayout } from "@/components/layout/AppLayout";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Pathless `_app` layout route (TICKET-005). Its `component` is the AppLayout
 * shell (persistent sidebar + header + scrollable main <Outlet/>). Because the
 * segment is pathless, its children keep their original URLs (`/`,
 * `/design-system`). App feature pages live under this route.
 */
export const Route = createFileRoute("/_app")({
  component: AppLayout,
});
