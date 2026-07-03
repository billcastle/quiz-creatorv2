import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Render /design-system via the memory-history router (same pattern as the
// TICKET-003 smoke test) so the route mounts through the AppLayout shell.
function renderDesignSystem() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/design-system"] }),
  });
  return render(<RouterProvider router={router} />);
}

// Reset theme state so the toggle assertion starts from a known baseline.
beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});
afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

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

test("in-page toggle flips the .dark class via lib/theme.ts", async () => {
  renderDesignSystem();

  const toggle = await screen.findByRole("switch", {
    name: /toggle dark theme/i,
  });
  expect(document.documentElement.classList.contains("dark")).toBe(false);

  fireEvent.click(toggle);

  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(localStorage.getItem("qc-theme")).toBe("dark");
});
