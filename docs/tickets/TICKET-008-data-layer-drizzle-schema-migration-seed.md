# TICKET-008 — Data layer: Drizzle schema, first migration & category/subcategory seed

- **Status:** DONE <!-- CREATED | IN PROGRESS | QA | AWAITING APPROVAL | DONE -->
- **Created:** 2026-07-03
- **Completed:** 2026-07-03
- **Branch:** ticket/008-data-layer-drizzle-schema-migration-seed
- **PR:** —
- **Area:** backend
- **Depends on:** TICKET-007 (DONE)

## Goal
Deliver the whole of ROADMAP **Phase 2 (Data layer)** as one coherent vertical slice: stand up Drizzle against Cloudflare D1 and define the full **core** app schema (`questionnaires`, `questionnaire_versions`, `responses`, `answers`, `likes`, `categories`, `subcategories`) per ARCHITECTURE §3, generate and apply the **first migration** to the local miniflare D1, wire a `drizzle(d1)` client factory bound to `c.env.DB`, add the deferred real `[[d1_databases]]` binding + `[env.preview]`/`[env.production]` sections + `.dev.vars` template to `wrangler.toml` (the TICKET-007 carry-over), and add a `seed.ts` that populates the seeded categories/subcategories. This gives every later phase a real, migrated database and a typed query surface. **Better-auth tables, R2, the shared snapshot Zod contract, and all domain/business routes are explicitly out of scope** (Phases 3/4/5+).

## Scope
**In scope:**
- **Drizzle setup & D1 binding (Phase 2 step 1):**
  - Add `drizzle-orm` (dep) and `drizzle-kit` (devDep) to `backend`, pinned EXACT (see Technical notes).
  - `backend/drizzle.config.ts` — Drizzle Kit config targeting the D1/SQLite dialect, `schema` → `src/db/schema.ts`, `out` → `backend/migrations/` (ARCHITECTURE §8.3). Use the `d1-http`/`sqlite` driver settings appropriate for the `wrangler d1 migrations` workflow (generation only; application is via Wrangler, see QA).
  - `backend/src/db/client.ts` — a `drizzle(d1)` factory (e.g. `getDb(env: Env)` / `getDb(c.env.DB)`) returning a typed Drizzle client bound to the **D1 binding** exposed as `c.env.DB` (already typed as `D1Database` in `env.ts` from TICKET-007). No global/module-level client — construct per-request from the binding (Workers has no persistent process state; see `workers-best-practices`).
  - **Flip on the deferred `wrangler.toml` bindings** (the TICKET-007 carry-over, ROADMAP Phase 1 remaining item):
    - Add the real `[[d1_databases]]` block (`binding = "DB"`, a `database_name`, and a placeholder/`local`-oriented `database_id` — see Technical notes on how to keep this local-only without a real remote provision).
    - Add `[env.preview]` and `[env.production]` sections that re-declare the `DB` binding per §1.3 (separate preview/prod D1). Keep them declared-but-placeholder (no secrets committed); the real remote `database_id`s land in Phase 18 (deploy/CI).
    - Add a **`.dev.vars` template** (committed as `.dev.vars.example`; ensure the real `.dev.vars` is gitignored) enumerating the Worker secrets known so far (`BETTER_AUTH_SECRET`, `FIRST_ADMIN_EMAIL`, `FIRST_ADMIN_PASSWORD`) as empty placeholders per §1.3 — **template only**, no real secrets, and no code consuming the admin ones yet (see admin-seed deferral).
- **Core schema (Phase 2 steps 2–4) — `backend/src/db/schema.ts`, all per ARCHITECTURE §3 with D1 conventions:**
  - `questionnaires` (§3.2): `id` (text PK, UUIDv7), `owner_id` (text — see FK note), `type`, `title`, `description` (text JSON), `visibility`, `status`, `private_link_token` (text unique nullable), `current_version_id` (text FK→`questionnaire_versions.id` nullable), `draft_snapshot` (text JSON nullable), `like_count` (integer default 0), `category_id` (text FK→`categories.id` nullable), `subcategory_id` (text FK→`subcategories.id` nullable), `created_at`/`updated_at` (integer ts). Indexes: `owner_id`, `(status, visibility)`, `like_count`, `category_id`, unique `private_link_token`.
  - `questionnaire_versions` (§3.3, ADR-004 full-JSON snapshot): `id` (PK), `questionnaire_id` (FK), `version_number` (integer), `type`, `snapshot` (text JSON — the entire authored content; typed generic only, **no Zod snapshot contract here** — that is Phase 5), `published_at` (ts), `created_by` (text — see FK note). Unique `(questionnaire_id, version_number)`; index `questionnaire_id`.
  - `responses` (§3.4): `id`, `questionnaire_id` (FK), `version_id` (FK→versions), `respondent_user_id` (text — see FK note), `submitted_at` (ts), `grading_status` (text), `score` (text JSON nullable), `created_at` (ts). Indexes: `questionnaire_id`, `version_id`, `respondent_user_id`. **No** uniqueness on respondent+questionnaire (FR-28 re-submission = multiple rows).
  - `answers` (§3.5): `id`, `response_id` (FK), `question_id` (text — the snapshot question id, **not a FK**), `value` (text JSON), `auto_grade` (text nullable), `manual_grade` (text JSON nullable). Index `response_id`.
  - `likes` (§3.7): `user_id` (text — see FK note), `questionnaire_id` (FK), `created_at` (ts). **Composite PK `(user_id, questionnaire_id)`** for dedup. Index `questionnaire_id`.
  - `categories` (§3.6): `id` PK, `name`, `slug` (unique), `position`.
  - `subcategories` (§3.6): `id` PK, `category_id` (FK→categories), `name`, `slug`, `position`.
  - The circular `questionnaires.current_version_id` ↔ `questionnaire_versions.questionnaire_id` reference must be handled with Drizzle's standard forward-reference pattern (see Technical notes).
- **First migration (Phase 2 step 5):** generate the first SQL migration via `drizzle-kit generate` into `backend/migrations/`, and apply it to the **local miniflare D1** via `wrangler d1 migrations apply <db> --local`. Commit the generated migration SQL + Drizzle journal/meta.
- **Schema smoke test (Phase 2 step 5):** add a Vitest test using the existing `@cloudflare/vitest-pool-workers` (workerd) harness that opens the **test D1**, and reads seeded rows / round-trips an insert-then-select, proving the migrated schema + bindings + client factory work in the real runtime. The workers pool must be pointed at the migrations so the test D1 is created from them (see Technical notes on the pool `d1` migration option).
- **Seed (Phase 2 step 6, partial — see admin deferral):** `backend/src/db/seed.ts` populating **categories + subcategories** (the fixed list — see the category-list decision below). Wire a runnable seed path/script (a small idempotent insert-if-absent routine, invokable locally and reusable by the schema smoke test / future Playwright global setup). The **first-admin seed is DEFERRED** (see decision).

**Out of scope (future tickets):**
- **better-auth tables** (`user`/`session`/`account`/`verification` + app additions) and any auth logic/merge — **Phase 3 (TICKET-009+)**. The `owner_id` / `created_by` / `respondent_user_id` / `likes.user_id` columns are modeled as **plain `text` id columns now with the FK deferred** (see decision); the FK-to-`user` and the auth tables land in Phase 3.
- **First-admin seed** (`FIRST_ADMIN_EMAIL`/`FIRST_ADMIN_PASSWORD`) — DEFERRED to Phase 3 (depends on the better-auth `user` table). The `.dev.vars.example` template may list the vars, but no code reads them yet.
- **R2 bucket binding + uploads** — R2 the *feature* is Phase 4. R2 **binding** in `wrangler.toml`: DEFERRED to Phase 4 (see decision). `BUCKET` remains a type in `env.ts` only.
- **Shared `QuestionnaireSnapshot` Zod contract** (`shared/src/snapshot.ts`) — Phase 5. The `snapshot`/`draft_snapshot`/`score`/`value`/`manual_grade` columns are typed JSON generics only; their runtime validation contract is Phase 5.
- **Any domain/business routes** (questionnaires/versions/responses/grading/likes/categories/admin), publishing/versioning logic, grading, explore, scale scoring, pagination.

## Technical notes (architect)
**Design source:** ARCHITECTURE §3 (all tables/columns/indexes and the **D1 conventions** header — FKs always enforced; booleans → `integer {mode:'boolean'}`; timestamps → `integer {mode:'timestamp_ms'}`; JSON → `text {mode:'json'}` with a typed generic; text UUIDv7 PKs; fractional-index `position` strings; the **100 bound-parameter** limit), §2.1 (`db/{client,schema,seed}.ts` locations — build exactly these three, nothing from `services/`, `routes/`, `auth/`), §8.3 (`drizzle.config.ts` + `migrations/` at `backend/`), §1.3 (environments: local miniflare D1 via `wrangler d1 migrations apply --local`, per-env `[env.preview]`/`[env.production]` bindings, `.dev.vars` for local secrets). ADR-002 (D1 is the ONLY database, via Drizzle D1 driver), ADR-004 (full-JSON immutable version snapshots — versions are ONE row, not normalized children), ADR-007 (`@app/shared` owns cross-boundary Zod contracts; **DB row types stay backend-only** — do NOT put schema/row types in `shared`). Consult the **`d1-drizzle-schema`** skill for the D1-correct Drizzle patterns and the **`wrangler`** skill for the exact `d1 migrations` command syntax.

**DECISION 1 — D1 binding NOW (resolve the TICKET-007 deferral):** ADD the real `[[d1_databases]]` `DB` binding to `wrangler.toml` in this ticket. Rationale: the data layer *is* the reason the binding was deferred; the client factory, migrations, and smoke test cannot exist without a bound `DB`. For **local** work no remote provisioning is required — `wrangler d1 migrations apply --local` creates the miniflare D1 from the migrations, and the vitest-pool-workers harness stands up its own test D1 from the same migrations. Keep `database_id` as a local-oriented placeholder (document it in Implementation notes); real preview/prod `database_id`s are provisioned in **Phase 18** (deploy/CI). Do NOT run `wrangler d1 create` against a real Cloudflare account as part of this ticket unless the user explicitly asks.

**DECISION 2 — R2 binding DEFERRED to Phase 4:** do NOT add `[[r2_buckets]]` now. No R2 usage exists until Phase 4 uploads; binding it now is dead config (same reasoning TICKET-007 used to defer D1). `BUCKET` stays a `env.ts` type. **Flag to user:** if you want the R2 binding declared alongside D1 now for parity, say so and the implementer will add a placeholder `[[r2_buckets]]` block; absent that, R2 waits for Phase 4.

**DECISION 3 — UUIDv7 id generation:** ARCHITECTURE §3 mandates **UUIDv7-ish sortable, app-created** text PKs (NOT auto-increment, NOT plain UUIDv4). `crypto.randomUUID()` on Workers returns **v4** (random, non-sortable) — it does NOT satisfy §3's "sortable/index-friendly" requirement. **Recommendation:** add a tiny, well-scoped **`uuidv7`** capability — either a minimal dependency (e.g. the `uuidv7` package, pinned exact) or a small in-repo helper (`backend/src/db/id.ts` or `lib/id.ts`) implementing the RFC 9562 v7 layout (48-bit ms timestamp + random). Prefer the tiny dependency for correctness unless the implementer confirms a compact, tested local helper. Whichever is chosen, expose a single `newId()` used by `seed.ts` (and later services). **Record the chosen approach + exact version (if a lib) in Implementation notes.** Do NOT scatter `crypto.randomUUID()` for these PKs.

**DECISION 4 — first-admin seed DEFERRED:** the first-admin seed requires the better-auth `user` table (Phase 3). Seed **only categories + subcategories** now; DEFER admin seeding to Phase 3 (it will read `FIRST_ADMIN_*` and insert into `user`). The `.dev.vars.example` template may list `FIRST_ADMIN_EMAIL`/`FIRST_ADMIN_PASSWORD` as placeholders for continuity, but no code reads them in this ticket. **Flag clearly** in Implementation notes.

**DECISION 5 — the fixed category/subcategory list is not enumerated in SPEC/ARCHITECTURE.** SPEC FR-34 says "seeded, fixed" but does not enumerate the canonical categories; TICKET-005 used a placeholder FE array ("General", "Science", "History", "Entertainment") explicitly marked TODO. The implementer must **not** invent a large taxonomy: seed a **small, clearly-labeled starter list** (reuse the TICKET-005 placeholder names for consistency, each with a stable `slug` + `position`, plus a couple of subcategories to exercise the FK), and record in Implementation notes that the canonical list is a follow-up for `ai-ba`/user confirmation. If the implementer wants the exact canonical list before seeding, **ask** rather than guess.

**FK-to-user modeling (all user-referencing columns):** `questionnaires.owner_id`, `questionnaire_versions.created_by`, `responses.respondent_user_id`, and `likes.user_id` reference a user that does not exist as a table until Phase 3. Model them as **plain `text` (not-null where §3 implies, nullable where §3 shows nullable)** with **no `references()`** yet. Add a code comment on each noting "FK→user.id completed in Phase 3 (better-auth tables)". The Phase-3 ticket will add the `user` table and the FK constraint via a follow-up migration. All **intra-core** FKs (questionnaires↔versions↔responses↔answers↔likes↔categories↔subcategories) ARE declared now (D1 enforces them).

**Circular reference (questionnaires ↔ questionnaire_versions):** `questionnaires.current_version_id` → `questionnaire_versions.id` while `questionnaire_versions.questionnaire_id` → `questionnaires.id`. Use Drizzle's forward-reference pattern (define both tables, use a callback/lazy reference or an explicit `foreignKey()` on one side) so the schema typechecks and the migration emits valid SQL. Note the `current_version_id` column is nullable, which lets a questionnaire exist before its first version.

**Exact-pin guidance (mirror TICKET-007):** add the new deps with EXACT versions (no `^`/`~`). Suggested current-stable pins to resolve at install: `drizzle-orm` (current stable, e.g. `0.44.x`), `drizzle-kit` (matched to `drizzle-orm`, e.g. `0.31.x`), and (if chosen) `uuidv7` (e.g. `1.0.x`). Keep all existing pins unchanged (`hono@4.12.27`, `wrangler@4.107.0`, `zod@4.4.3`, `@hono/zod-validator@0.8.0`, `@cloudflare/vitest-pool-workers@0.18.0`, `vitest@4.1.9`, `@cloudflare/workers-types@5.20260703.1`). **Implementer resolves the exact versions at `npm install` time and records them in Implementation notes.** If `drizzle-kit` requires a `better-sqlite3`/native build step for local generation, prefer the D1/`d1-http` generation path that avoids native deps; flag if a native build is unavoidable.

**Test-harness D1 migration:** `@cloudflare/vitest-pool-workers` can create a test D1 from the migration SQL. Configure the pool so the test D1 is built from `backend/migrations/` (the pool exposes a D1 migrations option / `applyD1Migrations` helper; confirm the exact API for `@cloudflare/vitest-pool-workers@0.18.0` — TICKET-007 already discovered this version's API differs from older docs, so verify against the installed version rather than trusting older examples). The smoke test then uses the pool's `env.DB` binding through `getDb()` to read seeded categories (or round-trip an insert). Keep tests running inside workerd (assert `navigator.userAgent === "Cloudflare-Workers"` if a runtime check is cheap, as TICKET-007's QA did).

## Acceptance criteria (ai-ba)
- [ ] **Drizzle client factory.** Given `backend/src/db/client.ts`, When typechecked, Then it exports a factory that builds a Drizzle D1 client from the `DB` binding (`c.env.DB` / `Env['DB']`), with **no** module-level/global client instance.
- [ ] **drizzle.config present.** Given `backend/drizzle.config.ts`, When `drizzle-kit generate` runs, Then it reads `src/db/schema.ts` and writes SQL into `backend/migrations/` for the D1/SQLite dialect.
- [ ] **D1 binding flipped on.** Given `backend/wrangler.toml`, When inspected, Then a real `[[d1_databases]]` block with `binding = "DB"` exists AND `[env.preview]` + `[env.production]` sections declare the `DB` binding (placeholder ids), completing the TICKET-007 deferral; And a committed `.dev.vars.example` template lists the known Worker secrets as empty placeholders while the real `.dev.vars` stays gitignored.
- [ ] **All core tables defined.** Given `src/db/schema.ts`, When reviewed against ARCHITECTURE §3, Then `questionnaires`, `questionnaire_versions`, `responses`, `answers`, `likes`, `categories`, and `subcategories` are all defined with the columns, types (D1 conventions: integer booleans/timestamps, JSON-as-TEXT typed generics, text UUIDv7 PKs), unique constraints, composite PK on `likes`, and indexes specified in §3.
- [ ] **User-FK deferral honored.** Given the user-referencing columns (`owner_id`, `created_by`, `respondent_user_id`, `likes.user_id`), When reviewed, Then each is a plain `text` id column with NO `references()` to a `user` table and carries a comment noting the FK completes in Phase 3; And NO better-auth `user`/`session`/`account`/`verification` tables are defined here.
- [ ] **Migration generated & applies locally.** Given the schema, When `drizzle-kit generate` then `wrangler d1 migrations apply <db> --local` run, Then the first migration is produced and applies cleanly to the local miniflare D1 with no errors; And the migration SQL + Drizzle meta/journal are committed.
- [ ] **UUIDv7 ids.** Given the id-generation helper, When reviewed, Then ids are UUIDv7 (sortable, app-generated) per §3 — NOT `crypto.randomUUID()` v4 for these PKs — and the chosen approach + exact version (if a dependency) is recorded in Implementation notes.
- [ ] **Seed populates categories/subcategories.** Given `src/db/seed.ts` and its script, When run against the local D1, Then the fixed categories + subcategories are inserted (idempotently), each with a stable `slug` + `position`; And re-running does not duplicate rows.
- [ ] **Schema smoke test (real runtime).** Given the `@cloudflare/vitest-pool-workers` harness pointed at the migrations, When the smoke test runs, Then it opens the test D1 via `getDb(env.DB)` and successfully reads seeded rows (or round-trips an insert-then-select) inside workerd.
- [ ] **Deps pinned.** Given `backend/package.json`, When inspected, Then `drizzle-orm`, `drizzle-kit` (and `uuidv7` if used) appear with EXACT versions (no `^`/`~`), previously-installed pins are unchanged, and the resolved versions are recorded in Implementation notes.
- [ ] **Quality gates.** Given the repo root, When I run `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test`, Then all pass with the new backend code (including the new smoke test).
- [ ] **Scope guard — no auth.** Given the diff, When reviewed, Then there is NO `better-auth` dependency, NO `auth/` folder, NO `user`/`session`/`account`/`verification` tables, and NO first-admin seed code (only optional `.dev.vars.example` placeholders).
- [ ] **Scope guard — no R2.** Given the diff, When reviewed, Then NO `[[r2_buckets]]` block was added to `wrangler.toml` and NO R2/upload code exists (per DECISION 2, absent user veto).
- [ ] **Scope guard — no snapshot contract / no routes.** Given the diff, When reviewed, Then there is NO `shared/src/snapshot.ts` (or any snapshot Zod contract), and NO new registered routes (the only real route remains `GET /api/health`); the `snapshot`/`draft_snapshot`/`score` columns are typed JSON generics only.

## QA notes (ai-qa)
Run from the repo root unless noted; report PASS/FAIL per criterion.
- **Migration generation:** `cd backend && npx drizzle-kit generate` — expect SQL emitted into `backend/migrations/` with no schema errors.
- **Local D1 apply:** `cd backend && npx wrangler d1 migrations apply <database_name> --local` — expect the first migration to apply cleanly to the miniflare D1 (creates all seven tables + indexes + the `likes` composite PK). Verify FK enforcement is on (D1 default).
- **Seed run:** run the wired seed script against the local D1; confirm categories + subcategories rows appear; run it **twice** and confirm no duplicates (idempotent).
- **Tests (real runtime):** `npm run test` (or `cd backend && npm test`) — expect the `@cloudflare/vitest-pool-workers` suite to run inside workerd and pass, including the new schema smoke test that opens the test D1 (built from `backend/migrations/`) via `getDb()` and reads seeded / round-tripped rows. Confirm the existing health/CORS/error/validate tests stay green.
- **Typecheck / lint / build:** `npm run typecheck`, `npm run lint` (Biome), `npm run format:check`, `npm run build` — expect all clean.
- **Scope-guard grep:** confirm no `better-auth`, no `user`/`session`/`account`/`verification` table definitions, no `[[r2_buckets]]` in `wrangler.toml`, no `shared/src/snapshot.ts`, no new route registrations beyond `GET /api/health`, and no `references()` pointing at a user table.
- **UUIDv7 check:** confirm generated PKs are v7 (timestamp-prefixed, sortable) not v4 — spot-check that two ids created in sequence sort in creation order.
- **Dep pin check:** `backend/package.json` shows exact versions for `drizzle-orm`/`drizzle-kit` (+`uuidv7` if used); existing pins unchanged.
- **`.dev.vars` hygiene:** confirm `.dev.vars.example` is committed with empty placeholders and the real `.dev.vars` is gitignored (no secrets committed).

## Implementation notes (filled after implementation)

**Files touched:**
- NEW:
  - `backend/src/db/schema.ts` — all 7 tables (`questionnaires`, `questionnaire_versions`, `responses`, `answers`, `likes`, `categories`, `subcategories`) with D1 conventions; `likes` composite PK; nullable circular `current_version_id` FK via `AnySQLiteColumn`; user-FK columns as plain `text` (FK to user deferred to Phase 3); JSON columns typed as `.$type<unknown>()`.
  - `backend/src/db/client.ts` — per-request `getDb(db: D1Database)` = `drizzle(db, { schema })`, no global/module-level client.
  - `backend/src/db/id.ts` — `newId()` via `uuidv7` (a phase-3+ seam; currently unreferenced).
  - `backend/src/db/seed.ts` — idempotent `seedCategories(db)` using deterministic fixed ids + `.onConflictDoNothing()`.
  - `backend/drizzle.config.ts` — dialect `sqlite`, generate-only.
  - `backend/.dev.vars.example` — empty placeholders (`BETTER_AUTH_SECRET`, `FIRST_ADMIN_EMAIL`, `FIRST_ADMIN_PASSWORD`).
  - `backend/test/apply-migrations.ts` — `beforeAll` `applyD1Migrations`.
  - `backend/test/schema.test.ts` — workerd smoke test: seed + idempotency.
  - `backend/migrations/0000_even_mephisto.sql` + `migrations/meta/_journal.json` + `migrations/meta/0000_snapshot.json`.
- MODIFIED:
  - `backend/package.json` — deps `drizzle-orm`/`uuidv7`, devDep `drizzle-kit`, scripts `db:generate`/`db:migrate:local`/`db:seed`.
  - `backend/wrangler.toml` — real `[[d1_databases]]` `DB` binding + `migrations_dir` + `[env.preview]`/`[env.production]` placeholder ids.
  - `backend/vitest.config.ts` — `readD1Migrations` in Node → miniflare `TEST_MIGRATIONS` binding → `apply-migrations` setupFile.
  - `backend/test/env.d.ts` — `Cloudflare.Env` global augmentation (see deviation (c)).
  - root `.gitignore` — `!backend/.dev.vars.example` allowlist.
  - root `package-lock.json`.

**Resolved dependency versions:** `drizzle-orm@0.45.2`, `uuidv7@1.2.1` (deps), `drizzle-kit@0.31.10` (devDep) — all exact. Existing pins unchanged.

**Decisions taken:**
- **D1 binding flipped ON now** (resolves the TICKET-007 deferral; local-only, placeholder `database_id`s, real ids in Phase 18).
- **R2 binding DEFERRED to Phase 4** (no `[[r2_buckets]]`; `BUCKET` stays an `env.ts` type only) — DECISION 2 honored, no user veto.
- **UUIDv7** via the `uuidv7` package behind `newId()`.
- **First-admin seed DEFERRED to Phase 3** (needs the better-auth `user` table); only categories/subcategories seeded.
- **Category list** = TICKET-005's placeholder four (General / Science / History / Entertainment) + 2 Science subcategories — canonical taxonomy is an ai-ba follow-up.
- **User-FK columns** (`owner_id` / `created_by` / `respondent_user_id` / `likes.user_id`) modeled as plain `text`; FK to `user` deferred to Phase 3.

**Implementation deviations (all sound, verified in review + QA):**
- (a) Seed uses deterministic FIXED ids (`cat_general`, `sub_physics`, …) not `newId()`, so re-runs collide on PK and `.onConflictDoNothing()` makes it idempotent.
- (b) `db:seed` = `vitest run test/schema.test.ts` (reuses the smoke test as the single seeding source; no seed route, honoring the no-new-routes scope guard) — note this seeds the TEST D1, not the persistent `wrangler dev` local D1 (persistent-local seeding deferred to a later phase / Playwright global-setup).
- (c) `backend/test/env.d.ts` uses `declare global { namespace Cloudflare { interface Env {...} } }` importing `D1Migration` from `cloudflare:test`, because `@cloudflare/vitest-pool-workers@0.18.0` has NO `ProvidedEnv` interface (verified against installed types).

**Review verdict:** APPROVE WITH NITS (no Critical/Major). Nits: `newId()` currently unreferenced (intentional phase-3 seam); `db:seed` maps to a test run; cosmetic import spacing.

**QA verdict:** PASSED — all 14 acceptance criteria; gates green (typecheck / lint / format:check / build / test); fresh D1 apply = 22 commands, 7 tables, `likes` composite PK, nullable circular FK, no user FKs (PRAGMA-verified); UUIDv7 version-nibble + ascending sort confirmed; seed idempotent (4 not 8); type-error injection breaks typecheck then reverts; backend 12 tests in workerd + frontend 5.

**Follow-ups discovered (→ future tickets):**
- (a) **Phase 3** — better-auth tables (`user`/`session`/`account`/`verification`) + auth logic/merge; add the FK-to-user constraint on `owner_id`/`created_by`/`respondent_user_id`/`likes.user_id` via a follow-up migration; wire the first-admin seed (reads `FIRST_ADMIN_*` from `.dev.vars`).
- (b) **ai-ba** — confirm the canonical category/subcategory taxonomy (current seed is the TICKET-005 placeholder).
- (c) **Phase 4** — add the real `[[r2_buckets]]` binding.
- (d) **Phase 18** — provision real preview/prod D1 `database_id`s (replace placeholders).
- (e) **Later** — a dedicated seed runner for the persistent `wrangler dev` local D1 (and Playwright global-setup) if needed.
