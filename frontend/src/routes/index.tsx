import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";

// Minimal index route (/). Renders through the AppLayout shell and uses one
// Tailwind-styled shadcn Button to prove the styling + alias pipeline works.
export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage(): ReactElement {
  return (
    <section className="flex flex-col items-start gap-4">
      <h1 className="font-semibold text-2xl tracking-tight">
        Questionnaire Creator
      </h1>
      <p className="text-muted-foreground">
        Frontend foundation is up: Vite + React, Tailwind, shadcn/ui, theming,
        and Tanstack Router.
      </p>
      <Button>Get started</Button>
    </section>
  );
}
