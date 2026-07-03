import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Render /design-system via the memory-history router (same pattern as the
// TICKET-003 smoke test). The route now lives under the pathless `_app` layout,
// so it mounts through the AppLayout shell — the URL is unchanged.
function renderDesignSystem() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/design-system"] }),
  });
  return render(<RouterProvider router={router} />);
}

test("mounts the three gallery sections and representative primitives", async () => {
  renderDesignSystem();

  // The three section headings prove the page structure rendered.
  expect(
    await screen.findByRole("heading", { name: /color tokens/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /inter type scale/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /first-batch primitives/i }),
  ).toBeInTheDocument();

  // At least one representative primitive from the batch renders: an Input
  // (via its label) and a Button.
  expect(screen.getByLabelText(/questionnaire title/i)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /^default$/i }),
  ).toBeInTheDocument();
});
