// Vitest setup: registers @testing-library/jest-dom matchers (augments
// vitest's `expect`) and cleans up the DOM after each test.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
