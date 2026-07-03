# PATTERN-003 — Backend testing with vitest-pool-workers (workerd)

- **Status:** ACTIVE
- **Category:** testing
- **Created:** 2026-07-03 · **Last updated:** 2026-07-03
- **Established by:** TICKET-007 (harness) + TICKET-008 (D1-in-tests) · **Related:** `docs/ARCHITECTURE.md` §3 · NFR-10 · `docs/patterns/PATTERN-002-d1-drizzle-schema.md`

## Rule
Backend tests run in the real Workers runtime via `@cloudflare/vitest-pool-workers`. Use `SELF.fetch()` for full-runtime route tests against the shipped Worker, and `app.request()` on an in-test `createApp()` instance for handlers not mounted on the shipped app. Migrate the test D1 from `backend/migrations/`.

## Rationale
Tests exercise workerd (not Node), matching production (NFR-10) — so runtime-specific behavior is caught in tests, not after deploy. The shipped app stays clean: test-only routes are attached to an in-test app instance and never ship.

## How to apply

`vitest.config.ts` reads the migrations **in Node** and injects them as a miniflare binding (`backend/vitest.config.ts`):

```ts
// backend/vitest.config.ts — import from the package MAIN entry, NOT /config
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const migrations = await readD1Migrations("./migrations");

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.toml" },
      miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
    }),
  ],
  test: { setupFiles: ["./test/apply-migrations.ts"] },
});
```

The setup file applies them in `beforeAll` (`backend/test/apply-migrations.ts`):

```ts
import { applyD1Migrations, env } from "cloudflare:test";
import { beforeAll } from "vitest";
beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});
```

Type the env. Note `@cloudflare/vitest-pool-workers@0.18.0` has **no `ProvidedEnv`** — augment `Cloudflare.Env` via `declare global` instead, importing `D1Migration` from `cloudflare:test` (`backend/test/env.d.ts`):

```ts
/// <reference types="@cloudflare/vitest-pool-workers/types" />
import type { D1Migration } from "cloudflare:test";
declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database;
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
```

Route tests use `SELF.fetch` — this dispatches through the deployed Worker in workerd (`backend/test/health.test.ts`):

```ts
import { SELF } from "cloudflare:test";
const res = await SELF.fetch("http://x/api/health");
expect(res.status).toBe(200);
```

D1 / data tests get the client via `getDb(env.DB)` and can assert the workerd runtime with the `navigator.userAgent` sanity check (`backend/test/schema.test.ts`):

```ts
import { env } from "cloudflare:test";
expect(navigator.userAgent).toBe("Cloudflare-Workers"); // running in workerd
const db = getDb(env.DB);
await seedCategories(db);
```

For handlers not mounted on the shipped app, attach them to an in-test `createApp()` instance and drive them with `app.request(...)` — do NOT add a test-only route to `backend/src/app.ts`.

## Anti-patterns
- ❌ plain Node vitest / using `app.request` only for route tests → ✅ `SELF.fetch` in workerd for shipped routes.
- ❌ mounting a `__test__` route in `app.ts` → ✅ attach it to an in-test `createApp()` instance.
- ❌ assuming `ProvidedEnv` exists in 0.18.0 → ✅ `Cloudflare.Env` global augmentation.
- ❌ importing helpers from `@cloudflare/vitest-pool-workers/config` (that subpath doesn't exist in 0.18.0) → ✅ import `cloudflareTest` / `readD1Migrations` from the package main entry.

## Scope & exceptions
Applies to all backend tests. Migrations are read once in Node (config) and applied per suite in `beforeAll`. If you need a route not in the shipped app, use an in-test `createApp()` instance so nothing test-only ships. Record deviations in the ticket's Implementation notes.

## References
- Canonical implementation: `backend/vitest.config.ts`, `backend/test/apply-migrations.ts`, `backend/test/env.d.ts`, `backend/test/health.test.ts`, `backend/test/schema.test.ts`.
- `docs/ARCHITECTURE.md` §3 · NFR-10 · TICKET-007 · TICKET-008.
