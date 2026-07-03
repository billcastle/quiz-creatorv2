// Vitest setup: apply D1 migrations to the workerd test DB before the suite.
// Migrations are read in Node (vitest.config) and injected as a JSON binding.
import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll } from "vitest";
beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});
