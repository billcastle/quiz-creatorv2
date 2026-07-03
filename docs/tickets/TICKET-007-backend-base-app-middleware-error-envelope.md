# TICKET-007 — Backend base: Hono app factory, middleware stack, error envelope & Workers-runtime test harness

- **Status:** DONE <!-- CREATED | IN PROGRESS | QA | AWAITING APPROVAL | DONE -->
- **Created:** 2026-07-03
- **Completed:** 2026-07-03
- **Branch:** ticket/007-backend-base-app-middleware-error-envelope
- **PR:** https://github.com/billcastle/quiz-creatorv2/pull/7
- **Area:** backend (+ `shared/` for the error-envelope contract)
- **Depends on:** TICKET-006 (DONE)

## Goal
Complete the rest of Phase 1 (Backend base) as one coherent vertical slice: turn the bare TICKET-006 health-only Worker into a properly structured Hono app — an `index.ts` fetch export split from a `createApp()` factory in `app.ts`, a Zod-validated `env.ts` (Env/Bindings type anticipating D1 + R2), the full non-auth middleware stack (CORS with origin allowlist + credentials, request-id/logging, and a central `onError` error handler), the shared error envelope (`@app/shared` `api/common.ts` + `lib/error.ts` `AppError`) and a `middleware/validate.ts` `@hono/zod-validator` helper, and migration of the test harness from plain Vitest to `@cloudflare/vitest-pool-workers` (miniflare) so routes run against the real Workers runtime. This gives every later backend ticket a real app skeleton, a tested error contract, and a runtime-accurate test harness to build on. No domain routes, no auth logic, and no DB.

## Scope
**In scope:**
- **App structure split** (ARCHITECTURE §2.1):
  - `backend/src/index.ts` — thin Worker entry: build the app via `createApp()` and `export default` it (fetch handler).
  - `backend/src/app.ts` — `createApp()` factory: instantiates `new Hono<{ Bindings: Env; Variables: ... }>()`, mounts the middleware stack (order per §2.2), registers `GET /api/health`, and wires `onError`.
  - `backend/src/env.ts` — the `Env`/`Bindings` type + a Zod schema that validates env/config. Author the D1 + R2 binding fields and secret fields (e.g. `BETTER_AUTH_SECRET`, CORS allowlist origins) in the type/schema **shape now** so later phases slot in, but **do not** declare the actual bindings in `wrangler.toml` (see decision below).
- **Middleware stack skeleton** (ARCHITECTURE §2.2, order = CORS → request-id/logging → error handler; auth-context is intentionally omitted, Phase 3):
  - `backend/src/middleware/cors.ts` — CORS via `hono/cors`: explicit **origin allowlist** (from env; localhost:5173 for local), `credentials: true`, never `*` with credentials (NFR-7, §1.2). Must be **auth-ready** (credentials + allowlist) but contain **no auth logic**.
  - request-id + structured single-line request logging (may use `hono/request-id` + `hono/logger` or a small custom logger; one line per request → `console`).
  - `backend/src/middleware/error-handler.ts` — Hono `onError` that maps thrown `AppError` and `ZodError` to the shared envelope (§6.3); no stack traces leaked.
- **Error contract + validation helper:**
  - `shared/src/api/common.ts` — the error-envelope Zod schema + inferred type (`{ error: { code, message, details? } }`) and the code enum (`VALIDATION_ERROR` 422, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `PAYLOAD_TOO_LARGE` 413, `INTERNAL` 500) per §6.3. Export it from `shared/src/index.ts` (currently empty — create the barrel).
  - `backend/src/lib/error.ts` — `AppError` class (code + status + message + optional details) and a helper that renders it to the shared envelope, consumed by the error handler.
  - `backend/src/middleware/validate.ts` — thin `@hono/zod-validator` wrappers (`json`/`query`/`param`) whose validation failure produces a `VALIDATION_ERROR` (422) envelope. No domain schemas yet — just the reusable helper. A tiny throwaway/test-only route MAY be used to prove it, but must not ship as a real endpoint.
- **New dependencies** (were explicitly OUT of scope in TICKET-006, now IN scope): add `zod` and `@hono/zod-validator` to `backend`, add `zod` to `shared`, and consume `@app/shared` from `backend` (add it as a workspace dependency). Pin exact versions (see Technical notes).
- **Test harness migration** (ARCHITECTURE §1.3, NFR-10):
  - Replace plain Vitest with `@cloudflare/vitest-pool-workers` (miniflare) so routes are exercised against the real Workers runtime. Add the pool config (`vitest.config.ts` using `defineWorkersConfig`) and an `env`/`SELF` fixture.
  - Port the existing `backend/test/health.test.ts` to the workers pool and add tests for the new surfaces (see Acceptance criteria). Keep the health assertion green.
- **`wrangler.toml`:** only add what the app code above needs to typecheck/run offline (e.g. keep `compatibility_date`/`flags`; the Vitest pool references `main`). Author the D1/R2 **types** in `env.ts`, but per the decision below, do **not** add real `[[d1_databases]]` / `[[r2_buckets]]` blocks or `[env.preview]`/`[env.production]` sections in this ticket.

**Out of scope (future tickets):**
- **D1/Drizzle schema, `db/client.ts`, migrations, seed** — Phase 2 (TICKET-008+).
- **Auth:** better-auth, `auth/*`, auth-context middleware (stack step 3), `/api/me`, session/cookie handling, merge — Phase 3. The CORS middleware here is auth-ready (credentials + allowlist) but ships **no** auth logic.
- **R2 uploads + tiptap sanitization** (`lib/sanitize.ts`, `lib/tiptap.ts`, upload routes) — Phase 4.
- **Any domain/business routes** — questionnaires, versions, responses, grading, likes, categories, admin.
- **Real `wrangler.toml` D1/R2 bindings and per-env sections + `.dev.vars` template** — deferred to Phase 2 (see decision). Flag if the user wants them pulled forward.

## Technical notes (architect)
**Design source:** ARCHITECTURE §1.2 (CORS/cookies/credentials), §1.3 (environments + miniflare local + `.dev.vars`), §2.1 (`backend/src` layout — build exactly the `index.ts`/`app.ts`/`env.ts`/`lib/error.ts`/`middleware/{cors,error-handler,validate}.ts` subset, nothing else), §2.2 (middleware order — implement steps 1, 2, 5; **skip** step 3 auth-context and step 4's domain validators), §6.3 (error envelope shape + codes), §5/ADR-007 (`@app/shared` is the single source of the contract; DB row types stay backend-only). ADR-002 (D1 is the only DB — but not bound here), ADR-009 (REST + `@hono/zod-validator`), ADR-011 (Biome is the linter/formatter — code must pass `biome check`). Maps to NFR-2 (Zod validation), NFR-7 (CORS allowlist + credentials, never `*`), NFR-10 (Vitest against real runtime), NFR-11 (local miniflare env, secrets via env).

**Important pre-condition discovered:** `shared/src` is currently **empty** (no `index.ts`, no `api/common.ts`) and `shared/package.json` has no `exports`/`zod` dep. This ticket therefore has to author the shared barrel (`shared/src/index.ts`), add `shared/src/api/common.ts`, add `zod` to `shared`, and give `shared/package.json` an `exports` map pointing at TS source (no build step per ADR-007). `backend` must add `@app/shared` as a workspace dependency to import the envelope type.

**New dependency versions (pin EXACT per repo convention):** suggested current-stable pins — `zod` `^`→ pin exact (e.g. `3.24.x`), `@hono/zod-validator` (e.g. `0.4.x`), `@cloudflare/vitest-pool-workers` (matched to the installed `vitest@4.1.9` and `wrangler@4.107.0`). Existing pins to keep: `hono@4.12.27`, `wrangler@4.107.0`, `@cloudflare/workers-types@5.20260703.1`, `vitest@4.1.9`. **Implementer:** resolve the exact current-stable versions at `npm install` time, pin them exactly (no `^`/`~`), and record the resolved versions in Implementation notes. If `@cloudflare/vitest-pool-workers` forces a `vitest` major bump, flag it before proceeding rather than silently changing the pin.

**Test harness note:** `@cloudflare/vitest-pool-workers` runs tests inside `workerd` and needs `vitest.config.ts` (`defineWorkersConfig` with `poolOptions.workers` pointing at `wrangler.toml` / `main`). Prefer the `SELF.fetch()` integration style (or `app.request()` offline fallback) for the health + CORS + error tests. Keep `backend/package.json`'s `test` script as `vitest run`.

**DECISION TO MAKE & RECORD — D1/R2 bindings now vs. defer to Phase 2:**
- **Recommendation: DEFER real D1/R2 bindings (and `[env.preview]`/`[env.production]` + `.dev.vars` template) to Phase 2.** Rationale: no D1 database, no Drizzle client, and no R2 usage exist yet in this ticket, so binding them now produces dead config that cannot be meaningfully exercised or tested and risks the `vitest-pool-workers` env needing a D1 it can't migrate. The **`env.ts` Zod schema + `Env`/`Bindings` TS type** should still be **authored now** to anticipate `DB` (D1) and `BUCKET` (R2) plus secrets, so Phase 2 only flips on the real `wrangler.toml` blocks. This keeps the ticket a clean, testable slice and matches the dependency chain (0→1→2) in ROADMAP §Sequencing.
- **User veto point:** if you want the bindings + per-env sections + `.dev.vars` template added now (the Phase 1 goal text does mention "D1 & R2 bindings"), say so and the implementer will add empty-but-declared bindings and env sections. Absent a veto, the implementer follows the DEFER recommendation above.

## Acceptance criteria (ai-ba)
- [ ] **App split.** Given the backend source, When I inspect it, Then `backend/src/index.ts` only builds the app via `createApp()` and `export default`s it, and `backend/src/app.ts` exposes a `createApp()` that returns the configured Hono instance (no fetch handler logic duplicated in `index.ts`).
- [ ] **Env validation.** Given `backend/src/env.ts`, When typechecked, Then it exports an `Env`/`Bindings` type including anticipated `DB` (D1) and `BUCKET` (R2) fields plus the CORS-allowlist/secret config, and a Zod schema that validates the runtime config (parsing invalid config throws/fails clearly).
- [ ] **Health still green (real runtime).** Given the migrated harness, When the health test runs under `@cloudflare/vitest-pool-workers`, Then `GET /api/health` returns 200 with `{ "status": "ok" }`.
- [ ] **CORS allowlist + credentials.** Given a request with an `Origin` on the allowlist, When it hits any route, Then the response carries `Access-Control-Allow-Origin: <that origin>` (never `*`) and `Access-Control-Allow-Credentials: true`; And given an `Origin` NOT on the allowlist, Then that origin is not reflected. (Covered by a Vitest test.)
- [ ] **Error envelope.** Given a route that throws an `AppError` (or a forced error), When the central `onError` runs, Then the response body matches the shared `{ error: { code, message, details? } }` shape from `@app/shared` with the correct HTTP status per §6.3, and no stack trace is leaked. (Covered by a Vitest test.)
- [ ] **Validation helper.** Given `middleware/validate.ts` wrapping `@hono/zod-validator`, When a request fails schema validation, Then the response is a `VALIDATION_ERROR` envelope with HTTP 422. (Proven by a test route/fixture, not a shipped domain endpoint.)
- [ ] **Shared contract.** Given `@app/shared`, When imported from `backend`, Then `shared/src/api/common.ts` exports the error-envelope schema/type + code enum and it is re-exported from `shared/src/index.ts`; And `backend` declares `@app/shared` as a workspace dependency and imports the envelope from it (no duplicated local copy).
- [ ] **Deps pinned.** Given `backend/package.json` and `shared/package.json`, When inspected, Then `zod`, `@hono/zod-validator`, and `@cloudflare/vitest-pool-workers` appear with EXACT versions (no `^`/`~`), and the previously-installed pins are unchanged; And the resolved versions are recorded in Implementation notes.
- [ ] **Quality gates.** Given the repo root, When I run `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test`, Then all pass with the new backend + shared code.
- [ ] **Scope guard — no auth.** Given the diff, When reviewed, Then there is NO better-auth dependency, NO `auth/` folder, NO auth-context middleware (stack step 3), and NO `/api/me` route. (CORS being credential-aware is allowed and expected.)
- [ ] **Scope guard — no DB/R2 runtime.** Given the diff, When reviewed, Then there is NO Drizzle/`db/` code, NO migrations/seed, NO R2 upload/serve routes; And (per the DEFER recommendation, absent user veto) NO real `[[d1_databases]]`/`[[r2_buckets]]` blocks or `[env.preview]`/`[env.production]` sections were added to `wrangler.toml` — only the `env.ts` types anticipate them.
- [ ] **Scope guard — no domain routes.** Given the diff, When reviewed, Then the only registered non-test route is `GET /api/health` (no questionnaires/versions/responses/grading/likes/categories/admin routes).

## QA notes (ai-qa)
Run from the repo root unless noted; report PASS/FAIL per criterion.
- **Typecheck:** `npm run typecheck` — expect backend + shared to compile (strict). 
- **Lint/format:** `npm run lint` (Biome) — expect clean; `npm run format:check` — expect clean.
- **Build:** `npm run build` — expect all workspaces with a build script to succeed.
- **Tests (real runtime):** `npm run test` (or `cd backend && npm test`) — expect the `@cloudflare/vitest-pool-workers` suite to run inside workerd and pass: health 200, CORS allowlist behavior, error-envelope shape/status, and the 422 validation-failure case.
- **Offline fallback check:** confirm an `app.request('/api/health')` style assertion (or `SELF.fetch`) returns 200 `{ "status": "ok" }` without needing `wrangler dev`.
- **CORS negative check:** a request with a non-allowlisted `Origin` must NOT get that origin reflected in `Access-Control-Allow-Origin`; and no route should emit `Access-Control-Allow-Origin: *` while credentials are enabled.
- **Error negative check:** hitting the forced-error/validation test route returns the exact shared envelope shape (`error.code`, `error.message`, optional `error.details`) with the correct status (422 for validation), and the response contains no stack trace / internal path.
- **Scope-guard grep:** confirm no `better-auth`, no `drizzle`, no `r2`/bucket route handlers, no `[[d1_databases]]`/`[env.` in `wrangler.toml`, and that `/api/health` is the only real route registered.
- **Dep pin check:** `backend/package.json` + `shared/package.json` show exact versions for the three new deps and unchanged existing pins.

## Implementation notes (filled after implementation)

**Files touched:**

- NEW: `shared/src/api/common.ts` (error-envelope contract: `ERROR_STATUS` code→status map, `ErrorCode`, `errorCodeSchema`, `errorEnvelopeSchema`, `ErrorEnvelope`); `shared/src/index.ts` (barrel).
- NEW: `backend/src/app.ts` (`createApp()` factory, typed `Hono<{ Bindings: Env; Variables: Variables }>`, middleware order CORS → requestId → logger, `onError`, registers only `GET /api/health`); `backend/src/env.ts` (`Env` with `DB: D1Database` / `BUCKET: R2Bucket` / `BETTER_AUTH_SECRET` / `CORS_ALLOWED_ORIGINS`, `Variables { requestId }`, lazy `parseConfig` / `configSchema`); `backend/src/lib/error.ts` (`AppError` + `toEnvelope`, `exactOptionalPropertyTypes`-safe); `backend/src/middleware/cors.ts` (`hono/cors`, function allowlist + credentials, never `*`, env-undefined guarded fallback to `http://localhost:5173`); `backend/src/middleware/error-handler.ts` (`onError` mapping `AppError` + `ZodError`→422 + generic 500 no-leak); `backend/src/middleware/validate.ts` (zValidator wrappers throwing `AppError('VALIDATION_ERROR')`).
- NEW tests: `backend/vitest.config.ts` (workers pool via `cloudflareTest` plugin), `backend/test/env.d.ts` (`cloudflare:test` types ref), `backend/test/{cors,error-envelope,validate,env}.test.ts`.
- MODIFIED: `shared/package.json` (exports map at TS source + `zod` dep), `shared/tsconfig.json` (removed `files: []` guard), `backend/package.json` (added `@app/shared@0.0.0`, `zod`, `@hono/zod-validator`, `@cloudflare/vitest-pool-workers`), `backend/src/index.ts` (slimmed to `createApp()` delegation), `backend/test/health.test.ts` (ported to `SELF.fetch`), root `package-lock.json` (regenerated).

**Resolved dependency versions:** `zod@4.4.3` (backend + shared — note this is zod **v4**, and it dedupes to a single copy in the app import graph), `@hono/zod-validator@0.8.0` (backend), `@cloudflare/vitest-pool-workers@0.18.0` (backend dev). Existing pins unchanged: `hono@4.12.27`, `wrangler@4.107.0`, `@cloudflare/workers-types@5.20260703.1`, `vitest@4.1.9`.

**Bindings decision taken:** DEFERRED real D1/R2 `wrangler.toml` bindings + `[env.*]` sections + `.dev.vars` to Phase 2 (per ticket recommendation, no user veto). Only `env.ts` TS types anticipate `DB` / `BUCKET` / secrets.

**Two API adaptations from the plan (both correct, worth recording):** (a) `@cloudflare/vitest-pool-workers@0.18.0` removed the `defineWorkersConfig` `/config` export; used the version-appropriate `cloudflareTest({ wrangler: { configPath } })` Vite-plugin API instead (verified running in workerd). (b) Used zod v4 top-level `flattenError()` instead of the v3 `.flatten()` method.

**Review verdict:** code-reviewer APPROVE WITH NITS (no Critical/Major). Nits: keep the out-of-scope untracked `.claude/agents/expert-react-frontend-engineer.md` out of this commit; anticipatory `parseConfig` / `Env`-vs-`configSchema` duplication is intentional for Phase 2.

**QA verdict:** PASSED — all 13 acceptance criteria PASS; gates green (typecheck / lint / format:check / build / test all exit 0; backend 9/9 tests in workerd, frontend 5/5); adversarial checks confirmed workerd execution (`navigator.userAgent === "Cloudflare-Workers"`), 500 no-leak, CORS never `*`, type-error injection breaks typecheck then reverts; working tree byte-identical.

**Follow-ups discovered (→ future tickets):**
- (a) Phase 2 — D1/Drizzle schema + `db/client.ts` + first migration + seed, and flip on the real `wrangler.toml` D1/R2 bindings + `[env.preview]` / `[env.production]` + `.dev.vars` template that were deferred here.
- (b) Phase 3 — better-auth + auth-context middleware (stack step 3) + `/api/me`; `BETTER_AUTH_SECRET` becomes required in `configSchema` and `parseConfig` gets wired in.
- (c) Optional: enrich the request logger with request-id (currently built-in `hono/logger`, no id in line).
- (d) Resolve the stray untracked `.claude/agents/expert-react-frontend-engineer.md` (belongs to TICKET-005) separately.
