import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";

// Index route (/). Nested under the pathless `_app` layout so it renders inside
// the AppLayout shell (sidebar + header). URL is unchanged (`/`).
export const Route = createFileRoute("/_app/")({
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
