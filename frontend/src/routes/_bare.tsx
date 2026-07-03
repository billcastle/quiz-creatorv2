import { BareLayout } from "@/components/layout/BareLayout";
import { createFileRoute } from "@tanstack/react-router";

/**
 * Pathless `_bare` layout route (TICKET-005). Its `component` is the chrome-free
 * BareLayout (no sidebar/header) — the slot for the future auth (sign-in /
 * sign-up) and quiz-answering pages per ARCHITECTURE §7.2. The real pages arrive
 * in their own tickets. NOTE: a childless pathless layout route resolves to `/`
 * and collides with `_app.index`, so `_bare.placeholder.tsx` exists purely to
 * give `_bare` a child and keep it registered — delete it once the first real
 * `_bare` page (auth sign-in) lands.
 */
export const Route = createFileRoute("/_bare")({
  component: BareLayout,
});
