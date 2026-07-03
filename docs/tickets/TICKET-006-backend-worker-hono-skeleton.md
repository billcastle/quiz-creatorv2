# TICKET-006 — Backend Worker + Hono skeleton (health route)

- **Status:** DONE <!-- CREATED | IN PROGRESS | QA | AWAITING APPROVAL | DONE -->
- **Created:** 2026-07-03
- **Completed:** 2026-07-03
- **Branch:** ticket/006-backend-worker-hono-skeleton
- **PR:** https://github.com/billcastle/quiz-creatorv2/pull/6
- **Area:** backend
- **Depends on:** TICKET-001 (DONE — monorepo root & npm workspaces), TICKET-002 (DONE — strict TS base config + Biome + root scripts)

## Goal
Stand up the **minimal runnable Cloudflare Worker** for the `backend/` workspace: a Hono app exposing `GET /api/health` → `{ "status": "ok" }`, exported as the Worker fetch handler, with a minimal Wrangler config and a real (source-aware) backend `tsconfig`. This is the FIRST backend step (Phase 1) — the deferred original TICKET-003 draft — and it unblocks every later backend ticket (env/config, D1/Drizzle, auth, domain routes) by giving them a running Worker and a working route to build on.

## Scope
**In scope:**
- **Install backend deps in the `backend/` workspace** (exact-pinned, no `^`/`~`):
  - dependency: `hono@4.12.27`.
  - devDependencies: `wrangler@4.107.0`, `@cloudflare/workers-types@5.20260703.1`.
  - Run `npm install` from the repo root so the root `package-lock.json` is updated. These are the ONLY new deps.
- **`backend/src/index.ts`** — a minimal Hono app:
  - Create a Hono instance, register `GET /api/health` returning JSON `{ status: "ok" }` (HTTP 200, `content-type: application/json`).
  - `export default app` (Hono's default export IS the Worker `{ fetch }` handler on Workers).
  - No middleware, no bindings, no other routes.
- **`backend/wrangler.toml`** — minimal Worker config (TOML chosen — see Technical notes for the toml-vs-jsonc rationale):
  - `name = "quiz-creator-api"` (or similar), `main = "src/index.ts"`, a current `compatibility_date` (`"2026-07-01"`), and `compatibility_flags = ["nodejs_compat"]` (rationale in Technical notes).
  - NO `[[d1_databases]]`, NO `[[r2_buckets]]`, NO `[[kv_namespaces]]`, NO `[env.preview]`/`[env.production]` sections, NO secrets/vars — bindings and per-env config are later tickets.
- **`backend/tsconfig.json`** — upgrade from the TICKET-002 empty-workspace guard to a real Worker config now that `src/` exists:
  - Keep `"extends": "../tsconfig.base.json"`.
  - Remove the `"files": []` guard; keep/adjust `"include": ["src/**/*.ts"]` so the real source is type-checked.
  - Add `"compilerOptions": { "types": ["@cloudflare/workers-types"], "lib": ["ESNext"] }` (Worker runtime globals; no DOM).
  - Do NOT weaken any base strict flags (`strict`, `noUncheckedIndexedAccess`, etc. stay ON).
- **`backend/package.json`** — deps/scripts:
  - Add `hono` (dep), `wrangler` + `@cloudflare/workers-types` (devDeps), exact-pinned.
  - Add scripts: `"dev": "wrangler dev"`, `"deploy": "wrangler deploy"`.
  - Keep existing `"typecheck": "tsc --noEmit"`.
- **One lightweight offline smoke test** (test-harness call — see Technical notes): a single `backend/test/health.test.ts` using **plain Vitest** that calls `app.request('/api/health')` and asserts status 200 and body `{ status: "ok" }`. Add `vitest` (exact-pinned, devDep) + a `"test": "vitest run"` script to `backend/package.json` ONLY if this stays trivial. If wiring plain Vitest here proves non-trivial for any reason, DEFER the test to the next ticket (the full workers-pool harness ticket) and state so in Implementation notes — do NOT pull in `@cloudflare/vitest-pool-workers` here.
- Ensure root `npm run typecheck`, `npm run lint`, and `npm run build` still succeed with the new backend source.

**Out of scope (future tickets — do NOT touch):**
- D1 / Drizzle / `drizzle.config.ts` / `db/` / migrations / schema / seed (Phase 2).
- R2 and KV bindings, `[[r2_buckets]]`, uploads, file-serving (Phase 4).
- better-auth, `auth/`, `/api/me`, session/cookie/CORS handling (Phase 3).
- Env/Bindings type (`env.ts`), Zod-validated config, `@app/shared` consumption (later Phase 1 step).
- The middleware stack (CORS, request-id/logging, auth-context, error-handler `onError`), `lib/error.ts`, `middleware/validate.ts` (later Phase 1 steps).
- Any domain/business routes (questionnaires, versions, responses, grading, likes, categories, admin).
- The full `@cloudflare/vitest-pool-workers` / miniflare test harness + a test D1 (its OWN next ticket).
- `[env.preview]`/`[env.production]` sections, `.dev.vars`, secrets, CI/deploy pipelines (Phase 18).

## Concrete deliverables
- **NEW** `backend/src/index.ts` — Hono app with `GET /api/health` → `{ status: "ok" }`, `export default app`.
- **NEW** `backend/wrangler.toml` — `name`, `main = "src/index.ts"`, `compatibility_date = "2026-07-01"`, `compatibility_flags = ["nodejs_compat"]`; no bindings, no env sections.
- **MODIFIED** `backend/tsconfig.json` — drop `"files": []`; keep `extends` + `include`; add `types: ["@cloudflare/workers-types"]` + `lib: ["ESNext"]`.
- **MODIFIED** `backend/package.json` — deps (`hono@4.12.27`), devDeps (`wrangler@4.107.0`, `@cloudflare/workers-types@5.20260703.1`, and `vitest` if the smoke test is included); scripts `dev`, `deploy`, keep `typecheck`, add `test` if the smoke test is included.
- **NEW (recommended)** `backend/test/health.test.ts` — plain-Vitest offline `app.request('/api/health')` smoke test.
- **REGENERATED** root `package-lock.json`.

## Technical notes (architect)
- **Alignment:** ARCHITECTURE §1.1/§1.2 (single Cloudflare Worker running Hono at `api.<domain>`), §2.1 (backend `src/` structure — `index.ts` is the Worker entry that builds the Hono app and exports the fetch handler; note the full §2.1 tree with `app.ts`/`env.ts`/`auth/`/`db/`/`routes/`/`services/`/`lib/`/`middleware/` is built incrementally in LATER tickets, NOT here), §8.3 (backend folder tree: `wrangler.toml`, `package.json`, `src/`, `test/`), §9.6 (Vitest is the backend test tool; the miniflare route harness via `@cloudflare/vitest-pool-workers` is the eventual target — deferred here). Consistent with ADR-009 (REST resource routes on Hono; `/api/*` prefix). D1 (ADR-002), R2/uploads, and better-auth topology (ADR-006) are explicitly deferred to their own phases.
- **Exact pinning (CLAUDE.md repo convention):** pin every dep to an exact version (no `^`/`~`), mirroring TICKET-002's pinning discipline. Versions verified current-stable at ticket creation: `hono@4.12.27`, `wrangler@4.107.0`, `@cloudflare/workers-types@5.20260703.1`. If the implementer finds a newer stable at install time, they may bump AND record the exact pinned versions in Implementation notes.
- **`compatibility_date` rationale:** set to a recent, fixed date (`2026-07-01`) so the Workers runtime behavior is pinned and reproducible (Cloudflare gates runtime/API changes behind the compatibility date). A fixed date near "today" gets current-standard behavior without silent drift.
- **`nodejs_compat` rationale:** Hono itself needs no Node built-ins for a bare route, so `nodejs_compat` is not strictly required for THIS ticket. It is added now because the imminent backend stack (better-auth, Drizzle/D1 driver, crypto/util usage) commonly relies on `nodejs_compat`, and adding the flag at skeleton time avoids a churny config change on the very next ticket. Rationale stated here so the flag is intentional, not cargo-culted. If the implementer prefers the strictly-minimal path, they MAY omit it and note the decision — but the recommended default is to include it.
- **Why the backend tsconfig needs `@cloudflare/workers-types`:** TICKET-002 left `backend/tsconfig.json` as a config-only guard (`"files": []` + `include`) with NO framework types, so it deliberately excluded runtime lib/types. Now that real source exists and runs on the Workers runtime (not Node, not the DOM), the config must add `types: ["@cloudflare/workers-types"]` to type the Worker fetch handler / `Request`/`Response`/`fetch` globals, and set `lib: ["ESNext"]` (NO `"DOM"` — this is not a browser). Keep `extends: "../tsconfig.base.json"` so ALL base strict flags (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `moduleResolution: "Bundler"`) stay in force — do NOT weaken them. Removing `"files": []` is required because it would otherwise exclude `src/` from the program.
- **`export default app`:** on Cloudflare Workers, a Hono instance's default export satisfies the module Worker `ExportedHandler` (`{ fetch }`) contract — no manual `{ fetch: app.fetch }` wrapper needed. Keep the route path exactly `"/api/health"` (Hono matches the full path; there is no base-path stripping configured).
- **wrangler.toml vs wrangler.jsonc:** TOML is chosen for the skeleton (it is Wrangler's long-standing default and the most widely documented format; ARCHITECTURE §8.3 references `wrangler.toml` explicitly). Either is valid to Wrangler; if the implementer strongly prefers JSONC they may switch, but must (a) update ARCHITECTURE §8.3's `wrangler.toml` reference via docs-keeper on `/done`, and (b) record the choice. Default = `wrangler.toml`.
- **How to verify the route OFFLINE (no Cloudflare account):** Hono apps are runtime-agnostic — `app.request('/api/health')` (or `app.request(new Request('http://x/api/health'))`) invokes the handler IN-PROCESS and returns a standard `Response`, with NO Wrangler, NO miniflare, and NO Cloudflare login required. QA can assert `res.status === 200` and `await res.json()` deep-equals `{ status: "ok" }`. This is why the smoke test is plain Vitest, not the workers-pool harness. `wrangler dev` (which spins a local miniflare Worker on `http://localhost:8787`) also works but is optional and heavier; the offline `app.request` path is the canonical acceptance verification.
- **Test-harness call:** include ONE lightweight `app.request('/api/health')` test in plain Vitest (trivial, offline, no account). DEFER the full `@cloudflare/vitest-pool-workers`/miniflare harness (test D1, bindings, `env` fixture) to its own next ticket to keep THIS ticket to one focused session. Do NOT install `@cloudflare/vitest-pool-workers` here.
- **Scope discipline:** this ticket must remain the bare minimum runnable Worker. Resist adding `app.ts`/`env.ts`/CORS/error-envelope now even though ARCHITECTURE §2 describes them — those are the next Phase 1 tickets and adding them here would blow the one-session budget and pre-empt later tickets.

## Acceptance criteria (ai-ba)
- [ ] **Given** the `backend/` workspace, **When** I inspect `backend/package.json` after install, **Then** it declares `hono@4.12.27` (dependency) and `wrangler@4.107.0` + `@cloudflare/workers-types@5.20260703.1` (devDependencies), all EXACT-pinned (no `^`/`~`); `npm install` at root completes with no errors and updates `package-lock.json`.
- [ ] **Given** scope guards, **When** I search the backend workspace + `wrangler.toml`, **Then** there are NO forbidden deps (no `drizzle-orm`/`drizzle-kit`, no `better-auth`, no `zod`, no `@app/shared` import) and NO D1/R2/KV bindings in the Wrangler config (`[[d1_databases]]`, `[[r2_buckets]]`, `[[kv_namespaces]]` all absent), and no `[env.preview]`/`[env.production]` sections.
- [ ] **Given** `backend/src/index.ts`, **When** I inspect it, **Then** it constructs a Hono app, registers `GET /api/health`, and `export default app` (the Worker fetch handler).
- [ ] **Given** the running Hono app, **When** `GET /api/health` is invoked, **Then** it returns HTTP 200 with JSON body EXACTLY `{"status":"ok"}` and `content-type` of `application/json`.
- [ ] **Given** `backend/wrangler.toml`, **When** I inspect it, **Then** `name`, `main = "src/index.ts"`, and a current `compatibility_date` are present, `compatibility_flags` includes `nodejs_compat` (or is intentionally omitted with a recorded rationale), and there are NO bindings and NO env sections.
- [ ] **Given** `backend/tsconfig.json`, **When** I inspect it, **Then** it still `"extends": "../tsconfig.base.json"`, the `"files": []` guard is REMOVED, `include` covers `src/`, `types: ["@cloudflare/workers-types"]` and `lib: ["ESNext"]` are set, and NO base strict flag is weakened/overridden.
- [ ] **Given** the repo root, **When** I run `npm run typecheck`, **Then** it exits 0 — the backend now type-checks REAL source against `@cloudflare/workers-types` under the inherited strict config (the empty-workspace guard is gone).
- [ ] **Given** the repo root, **When** I run `npm run lint` (`biome check .`), **Then** it exits 0 on the new backend source (`src/index.ts`, `wrangler.toml`/config, any test file).
- [ ] **Given** the offline test path, **When** I run the health smoke test (`npm run test` in `backend/`, or `npx vitest run`), **Then** `app.request('/api/health')` returns 200 and body deep-equals `{ status: "ok" }` — verifiable WITHOUT a Cloudflare account, WITHOUT `wrangler login`, and WITHOUT miniflare/workers-pool. (If the smoke test was deferred per Technical notes, this criterion is satisfied instead by a documented manual `app.request` verification recorded in Implementation notes.)
- [ ] **Given** the root `npm run build`, **When** I run it, **Then** it still succeeds (no real backend build is wired here beyond the `--workspaces --if-present` delegator; nothing regresses).

## QA notes (ai-qa)
How to verify:
1. From the repo root run `npm install` — expect success. Diff `backend/package.json` + `package-lock.json`: confirm ONLY `hono`, `wrangler`, `@cloudflare/workers-types` (and `vitest` IF the smoke test is included) were added, all exact-pinned.
2. Open `backend/src/index.ts` — confirm a Hono app, a `GET /api/health` handler returning `{ status: "ok" }`, and `export default app`.
3. **Offline route check (no Cloudflare account):** run the smoke test — `cd backend && npm run test` (or `npx vitest run`). Confirm it passes: status 200, body `{"status":"ok"}`. If no test was added, in a Node REPL / scratch spec import the app and `await app.request('/api/health')`, then assert `res.status === 200` and `await res.json()` deep-equals `{ status: "ok" }`.
4. Run `npm run typecheck` at root — confirm exit 0 and that the backend is actually type-checking real source (temporarily introduce a type error in `src/index.ts`, re-run, confirm it FAILS with exit ≠ 0, then revert). Confirm `@cloudflare/workers-types` globals resolve (no "cannot find name 'Response'"-style errors).
5. Run `npm run lint` at root — confirm `biome check .` exits 0 on the backend source; introduce a formatting/lint violation in `src/index.ts`, confirm Biome flags it, then revert.
6. Open `backend/wrangler.toml` — confirm `name`, `main = "src/index.ts"`, `compatibility_date` present, `compatibility_flags` = `["nodejs_compat"]` (or omitted-with-rationale). Confirm ABSENCE of `[[d1_databases]]`, `[[r2_buckets]]`, `[[kv_namespaces]]`, `[env.preview]`, `[env.production]`, `vars`, secrets.
7. Open `backend/tsconfig.json` — confirm `extends` intact, `"files": []` removed, `include` covers `src/`, `types: ["@cloudflare/workers-types"]`, `lib: ["ESNext"]` (NO `"DOM"`), no strict-flag overrides.
8. (Optional, heavier) `cd backend && npx wrangler dev` — if run, confirm the Worker boots locally and `curl -s http://localhost:8787/api/health` returns `{"status":"ok"}`. This is NOT required for acceptance (offline `app.request` is canonical) and needs no Cloudflare login for local dev.
9. Scope-guard search: grep the backend workspace for `drizzle`, `better-auth`, `zod`, `@app/shared`, `d1_databases`, `r2_buckets`, `kv_namespaces`, CORS/middleware — confirm none present.
10. Run `npm run build` at root — confirm it still exits 0.

## Implementation notes (filled after implementation)
- Files touched:
  - NEW `backend/src/index.ts` — Hono app; `GET /api/health` → `{ status: "ok" }`; `export default app`.
  - NEW `backend/wrangler.toml` — `name = "quiz-creator-api"`, `main = "src/index.ts"`, `compatibility_date = "2026-07-01"`, `compatibility_flags = ["nodejs_compat"]`; no bindings, no env sections.
  - NEW `backend/test/health.test.ts` — plain-Vitest offline `app.request("/api/health")` smoke test.
  - MODIFIED `backend/tsconfig.json` — removed `"files": []` guard; kept `extends: "../tsconfig.base.json"`; `include: ["src/**/*.ts", "test/**/*.ts"]`; added `compilerOptions: { types: ["@cloudflare/workers-types"], lib: ["ESNext"] }` (no DOM). No base strict flag weakened.
  - MODIFIED `backend/package.json` — deps/devDeps + scripts `dev`, `deploy`, `test`; kept `typecheck`.
  - REGENERATED root `package-lock.json` (added 33 packages; backend direct deps = the 4 below only).
- Exact pinned versions installed (all exact, no `^`/`~`):
  - dependency: `hono@4.12.27`.
  - devDependencies: `wrangler@4.107.0`, `@cloudflare/workers-types@5.20260703.1`, `vitest@4.1.9`.
  - No bump needed — the ticket-specified versions were current-stable at install time (vitest pinned to current-stable 4.1.9 for the smoke test).
  - Scope guards held: NO drizzle-orm/drizzle-kit/better-auth added; backend declares no `zod` and no `@app/shared` (the `zod@4.4.3` present in the tree is a pre-existing transitive dep of the frontend's `@tanstack/router-plugin`, not introduced here).
- wrangler config format chosen (toml/jsonc) + nodejs_compat include/omit decision:
  - Chose `wrangler.toml` (default per ARCHITECTURE §8.3). `nodejs_compat` INCLUDED per the recommended default (imminent better-auth/Drizzle stack commonly needs it; avoids a churny config change next ticket). No `[[d1_databases]]`/`[[r2_buckets]]`/`[[kv_namespaces]]`, no `[env.*]`, no vars/secrets.
- Test-harness decision (smoke test included, or deferred + why):
  - INCLUDED. Plain Vitest (`vitest@4.1.9`, default config, no `@cloudflare/vitest-pool-workers`). `app.request("/api/health")` verified offline (no wrangler login / no miniflare): status 200, body deep-equals `{ status: "ok" }`. Test passes.
- Verification (all from repo ROOT unless noted):
  - `npm install` → exit 0 (added 33 packages, 0 vulnerabilities).
  - `npm run typecheck` → exit 0 (frontend + backend + shared). Negative check: injected type error in `src/index.ts` → exit 2 (`TS2322`), confirming backend type-checks real source vs `@cloudflare/workers-types`; reverted → exit 0.
  - `npm run lint` (`biome check .`) → exit 0 (49 files, no fixes).
  - `npm run build` → exit 0 (frontend builds; backend has no build script, skipped via `--if-present`).
  - `npm --workspace @app/backend run test` (`vitest run`) → exit 0 (1 file, 1 test passed). Root `npm run test` delegator → all workspace tests pass (5 total incl. backend).
- Review verdict: code-reviewer **APPROVE WITH NITS** (no critical/major). Verified live: `/api/health` → 200 + `{"status":"ok"}` + `application/json`; `export default app` correct; deps exact-pinned; no forbidden deps/bindings; strict TS + Biome clean. Nits: exclude the stray untracked `.claude/agents/expert-react-frontend-engineer.md` from this commit (belongs to TICKET-005); optionally split a test-only tsconfig later.
- QA verdict: **PASSED** — all 10 acceptance criteria PASS; adversarial checks confirm the test catches a wrong body, typecheck catches type errors, `@cloudflare/workers-types` globals resolve, and DOM is correctly excluded (`lib` ESNext only); reproducible from clean install; working tree byte-identical after QA.
- Follow-ups discovered (→ future tickets):
  - (a) Next backend step: env/config + middleware stack (CORS, error-envelope, request-id) per ARCHITECTURE §2.
  - (b) Full `@cloudflare/vitest-pool-workers`/miniflare test harness (its own ticket).
  - (c) Then D1/Drizzle schema (Phase 2), better-auth (Phase 3).
  - (d) Optional test-only tsconfig split.
  - (e) Still-standing: canonical form-field label pattern; design-system batch 2; delete `_bare.placeholder.tsx` when the first bare page lands.
  - (f) The untracked `.claude/agents/expert-react-frontend-engineer.md` file to be resolved separately.
