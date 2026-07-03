import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * Throwaway placeholder child (TICKET-005). The router generator treats a
 * pathless layout route file with NO children as a LEAF that resolves to its
 * parent path ("/"), which collides with the `_app` index route. Registering
 * one trivial child under `_bare` keeps it a LAYOUT route (the intended slot for
 * the future auth + quiz-answering pages). Delete this file when the first real
 * `_bare` page (e.g. `/auth/sign-in`) lands. URL: `/placeholder`.
 */
export const Route = createFileRoute("/_bare/placeholder")({
  component: BarePlaceholder,
});

function BarePlaceholder(): ReactElement {
  return <p className="text-muted-foreground text-sm">Bare layout slot.</p>;
}
