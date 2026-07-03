import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, expect, test } from "vitest";

import { AppLayout } from "@/components/layout/AppLayout";
import { BareLayout } from "@/components/layout/BareLayout";
import { useUiStore } from "@/stores/uiStore";

// Reset persisted UI + theme state before/after each test for isolation.
beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.removeAttribute("data-theme");
  useUiStore.setState({ sidebarCollapsed: false });
});
afterEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.removeAttribute("data-theme");
  useUiStore.setState({ sidebarCollapsed: false });
});

// Mount a layout component through a minimal memory-history router so its
// <Outlet/> resolves. Renders a tiny child route at "/".
function renderLayout(Layout: () => ReactElement) {
  const rootRoute = createRootRoute({ component: Layout });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <div>child content</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

test("sidebar collapse toggle flips + persists sidebarCollapsed", async () => {
  renderLayout(AppLayout);

  const nav = await screen.findByRole("navigation", { name: /main/i });
  expect(nav).toHaveAttribute("data-collapsed", "false");
  expect(useUiStore.getState().sidebarCollapsed).toBe(false);

  // Collapse.
  fireEvent.click(screen.getByRole("button", { name: /collapse sidebar/i }));
  expect(useUiStore.getState().sidebarCollapsed).toBe(true);
  expect(nav).toHaveAttribute("data-collapsed", "true");
  // Persisted to the qc-ui localStorage key.
  expect(localStorage.getItem("qc-ui")).toContain('"sidebarCollapsed":true');

  // Expand again.
  fireEvent.click(screen.getByRole("button", { name: /expand sidebar/i }));
  expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  expect(nav).toHaveAttribute("data-collapsed", "false");
});

test("header theme switcher toggles .dark on <html> and updates qc-theme", async () => {
  renderLayout(AppLayout);

  expect(document.documentElement.classList.contains("dark")).toBe(false);

  // The fast light/dark toggle button switches to dark.
  fireEvent.click(
    await screen.findByRole("button", { name: /switch to dark theme/i }),
  );
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(localStorage.getItem("qc-theme")).toBe("dark");

  // Toggling back returns to light.
  fireEvent.click(
    screen.getByRole("button", { name: /switch to light theme/i }),
  );
  expect(document.documentElement.classList.contains("dark")).toBe(false);
  expect(localStorage.getItem("qc-theme")).toBe("light");
});

test("AppLayout renders a sidebar + header; BareLayout renders neither", async () => {
  const { unmount } = renderLayout(AppLayout);

  expect(
    await screen.findByRole("navigation", { name: /main/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("banner")).toBeInTheDocument();
  unmount();

  renderLayout(BareLayout);
  // Wait for the routed child to resolve inside the chrome-free frame.
  const main = await screen.findByRole("main");
  expect(within(main).getByText(/child content/i)).toBeInTheDocument();
  // No app-shell chrome.
  expect(screen.queryByRole("navigation", { name: /main/i })).toBeNull();
  expect(screen.queryByRole("banner")).toBeNull();
});
