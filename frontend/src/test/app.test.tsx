import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Smoke test: the index route renders through the AppLayout shell.
test("mounts the app shell and renders the index route", async () => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });

  render(<RouterProvider router={router} />);

  expect(
    await screen.findByRole("heading", { name: /questionnaire creator/i }),
  ).toBeInTheDocument();
});
