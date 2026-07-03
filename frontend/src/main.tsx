import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { RouterProvider, createRouter } from "@tanstack/react-router";

import { initTheme } from "@/lib/theme";
import { routeTree } from "@/routeTree.gen";

import "@/index.css";

// Tanstack Router instance built from the file-based generated route tree.
const router = createRouter({ routeTree });

// Register the router instance for full type inference across the app.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Apply the persisted theme (.dark class) before first paint.
initTheme();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
