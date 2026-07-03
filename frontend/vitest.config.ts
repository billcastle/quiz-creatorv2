import path from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Test config mirrors the router codegen + alias from vite.config so the
// generated routeTree.gen.ts is available and imports resolve. jsdom provides
// the DOM for React Testing Library.
export default defineConfig({
  plugins: [tanstackRouter({ target: "react" }), react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
