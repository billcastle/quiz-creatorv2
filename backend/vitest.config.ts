// Vitest config for the backend, running tests inside workerd via
// @cloudflare/vitest-pool-workers (miniflare) so routes exercise the real
// Workers runtime (ARCHITECTURE §1.3, NFR-10). The cloudflareTest plugin wires
// the workers pool itself and reuses wrangler.toml for main + compat settings.
// No D1/R2 bindings configured this phase.
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.toml" } })],
});
