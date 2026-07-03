# ROADMAP.md — Phased Build Plan

> Status: **LIVING PLAN.** Derived from `docs/SPEC.md` (what/why) and `docs/ARCHITECTURE.md` (how), with decisions of record in `docs/DECISIONS.md` (ADR-001..011).
> This roadmap lists **prospective, ticket-sized steps** per phase. It does **not** assign ticket IDs and does **not** create tickets. Tickets are created **one at a time** via `/next-ticket` (CLAUDE.md Golden Rule 1).
> Last updated: 2026-07-03.

---

## Reordering note (2026-07-03) — frontend foundation pulled earlier

**Pivot:** TICKET-003 was re-scoped from the *backend Worker skeleton* to the **frontend foundation** (Phase 12 base work: Vite + React + Tailwind + shadcn + light/dark theming + Inter + a minimal Tanstack Router shell). This is done ahead of the default backend-first order (ARCHITECTURE §10) to unblock the **`/design-system` page + component showcase** as the next ticket.

**Consequence:** the **backend Worker skeleton** (original TICKET-003 draft: Hono `index.ts` + `GET /api/health` + minimal `wrangler.toml` + backend tsconfig upgrade — the first small step of **Phase 1** below) is **DEFERRED** and will be re-created as its own later ticket via `/next-ticket`. Its scope is preserved in Phase 1's first checklist item (Wrangler/Hono init) and the health-route + Vitest-harness items. Phases and their hard dependencies are otherwise unchanged; only the *creation order* of the next few tickets shifts to interleave FE foundation with the backend base.

---

## 0. How to read this

- Each **Phase** has a goal, a checklist of **small, independently shippable steps** (each ≈ one focused `/implement` session), its **dependencies**, and a **phase acceptance signal**.
- The `[ ]` checklist items are **prospective ticket titles**, not tickets. The producer converts the *next* logical unchecked item into exactly one ticket when asked.
- Sequencing follows ARCHITECTURE §10 (build-in-small-tickets order) and respects the D1/auth/versioning dependency chain.
- Cross-cutting threads (testing, docs/CONTEXT upkeep, R2, sanitization, validation, authz) are woven through phases — see §"Cross-cutting threads".
- FR/NFR/ADR references map each phase back to the SPEC and decisions.

---

## Phase 0 — Foundations: monorepo, workspaces & tooling

**Goal:** A clean, buildable monorepo skeleton with the three workspaces (`frontend/`, `backend/`, `shared/`) and shared tooling, so every later ticket has a home.

Steps:
- [ ] Initialize repo root: `package.json` with workspaces (`frontend`, `backend`, `shared`), `.gitignore`, `.editorconfig`, Node/PM version pin.
- [ ] Add root TypeScript config (strict-mode base tsconfig) + shared lint/format config (**Biome** — single formatter + linter; see ADR-011, replaces the earlier ESLint + Prettier note), scripts placeholders.
- [ ] Scaffold `shared/` workspace (`@app/shared`): `package.json` (type: module, exports src), empty `src/index.ts`, tsconfig — no schemas yet.
- [ ] Seed `shared/src/enums.ts`: Role, QuestionnaireType, QuestionType, Visibility, GradingStatus enums (Zod + inferred types).
- [ ] Add `docs/CONTEXT.md` skeleton (project state file for context recovery) and confirm ticket `_TEMPLATE.md`/`INDEX.md` are ready.

**Dependencies:** none (first phase).
**Acceptance signal:** `npm install` at root resolves all three workspaces; `tsc --noEmit` passes across workspaces; `@app/shared` importable from `frontend/` and `backend/` stubs.
**Maps to:** ARCHITECTURE §5, §8; ADR-001, ADR-007; NFR-1.

---

## Phase 1 — Backend base: Worker + Hono + D1/Drizzle + config

**Goal:** A running Worker exposing a Hono app with the middleware stack, D1 & R2 bindings, env validation, and the error envelope — no domain routes yet.

Steps:
- [~] Initialize `backend/`: Wrangler project, `wrangler.toml` — Worker + minimal `wrangler.toml` done (TICKET-006); the D1 + R2 bindings, `[env.preview]`/`[env.production]` sections, and `.dev.vars` template were **DEFERRED to Phase 2** (only `env.ts` types anticipate them). `env.ts` authored in TICKET-007.
- [x] Scaffold Hono app: `index.ts` (fetch export), `app.ts` (`createApp`), `env.ts` (Zod-validated Env/Bindings type). — TICKET-007.
- [x] Add middleware stack skeleton: CORS (origin allowlist + credentials), request-id/logging, error-handler (`onError`). — TICKET-007.
- [x] Add `lib/error.ts` (AppError + envelope) and `middleware/validate.ts` (`@hono/zod-validator` helpers) wired to the `shared` error-envelope type. — TICKET-007.
- [x] Add a `GET /api/health` route (TICKET-006) + a Vitest route test via `@cloudflare/vitest-pool-workers` (test harness bootstrap; TICKET-007 migrated the harness to workerd/miniflare).

**Status:** Backend-base delivered by **TICKET-006 + TICKET-007** (both DONE 2026-07-03). Remaining item — real `wrangler.toml` D1/R2 bindings + `[env.*]` sections + `.dev.vars` — carried into Phase 2.
**Dependencies:** Phase 0 (workspaces, shared enums, error-envelope type).
**Acceptance signal:** `wrangler dev` serves the Worker locally; `/api/health` returns 200; CORS + error envelope verified by a passing Vitest route test.
**Maps to:** ARCHITECTURE §1.2, §1.3, §2.1, §2.2, §6.3; ADR-002, ADR-009; NFR-2, NFR-7, NFR-10, NFR-11.

---

## Phase 2 — Data layer: Drizzle schema, migrations & seed

**Goal:** The full D1 app schema, first migration applied locally, and the seed for categories/subcategories + first admin.

Steps:
- [ ] Add `drizzle.config.ts` + `db/client.ts` (drizzle(d1) factory); establish migration workflow (`wrangler d1 migrations`).
- [ ] Define core app tables in `db/schema.ts`: `questionnaires`, `questionnaire_versions` (JSON snapshot), with D1 conventions (integer booleans/timestamps, JSON-as-TEXT, text UUIDv7 PKs, indexes).
- [ ] Define `responses` + `answers` tables (version-bound response, snapshot-question-id references, grading status).
- [ ] Define `likes` (composite PK dedup) + `categories`/`subcategories` tables and their indexes.
- [ ] Generate & apply the **first migration** to local miniflare D1; add a schema smoke test.
- [ ] Add `db/seed.ts`: seeded categories + subcategories (fixed list) and the env-configured first-admin seed; wire a seed script.

**Dependencies:** Phase 1 (drizzle client factory, env, Wrangler bindings).
**Acceptance signal:** `wrangler d1 migrations apply --local` succeeds; seed populates categories + first admin; a Vitest test opens a test D1 and reads seeded rows.
**Maps to:** ARCHITECTURE §3 (all), §2.1(db/); ADR-002, ADR-004; FR-30/33/34; NFR-8.

---

## Phase 3 — Auth: better-auth (anonymous + username), `/me`, merge

**Goal:** Every visitor gets a real anonymous identity; registration/login by username-or-email; anonymous→registered account merge.

Steps:
- [ ] Add better-auth tables to the Drizzle schema + migration (`user`/`session`/`account`/`verification` with app additions: role, is_anonymous, username, avatar_url).
- [ ] Configure `auth/auth.ts`: better-auth server instance (Drizzle/D1 adapter, `emailAndPassword` without verification, no mailer).
- [ ] Enable `anonymous` plugin (real anon user + session on first visit) + `username` plugin (username-or-email login, unique + immutable username).
- [ ] Mount auth handler in `auth.routes.ts` (`ALL /api/auth/*`) + `GET /api/me` (hydrate current user).
- [ ] Add auth-context middleware (resolve session, set `c.get('user')`, does not reject anon) + `auth/guards.ts` (`requireAuth`, `requireOwnerOrRole`, `requireRole`).
- [ ] Implement `auth/merge.ts`: atomic `db.batch` re-point of owner_id/respondent_user_id/likes (dedup) on `onLinkAccount`, delete anon user.
- [ ] Vitest: anonymous session issuance, username-or-email login, and merge (ownership transfer + like dedup + no orphaned anon rows).

**Dependencies:** Phase 2 (user/likes/questionnaires/responses tables exist for merge re-pointing).
**Acceptance signal:** first visit yields an anon user row + session; register/login by username OR email works; merge transfers ownership and dedups likes with no orphaned anon data (FR-2 acceptance) — all Vitest-covered.
**Maps to:** ARCHITECTURE §2.3, §2.4, §6.2; ADR-006; FR-1..FR-5, FR-7, FR-33 (dedup); NFR-7.

---

## Phase 4 — Uploads & rich-text sanitization

**Goal:** R2-backed image/avatar uploads with strict server-side validation, and the tiptap allowlist sanitizer used by all content writes.

Steps:
- [ ] Add `lib/tiptap.ts` (allowlist node/mark schema) + `lib/sanitize.ts` (parse/reject unknown nodes, strip attrs, enforce no-images-in-results, character-count max) + Vitest fixtures.
- [ ] Mirror the tiptap allowlist as `shared/src/tiptap.ts` (`TiptapDoc` Zod) for FE/BE parity.
- [ ] Implement `POST /api/uploads/tiptap-image` (image types, ≤5 MB, magic-byte sniff) → R2, returns embeddable URL.
- [ ] Implement `POST /api/uploads/avatar` (≤10 MB, image types) → R2, sets user avatar.
- [ ] Implement `GET /api/files/:key+` (stream from R2 with content-type + cache headers); Vitest for upload validation + read-back.

**Dependencies:** Phase 3 (uploads are auth-required; avatar sets on user); Phase 1 (R2 binding, error envelope incl. 413).
**Acceptance signal:** valid images upload and read back through the Worker; oversize/wrong-type/mismatched-magic-byte uploads rejected (413/422); sanitizer rejects disallowed nodes and forbids images in results docs — all Vitest-covered.
**Maps to:** ARCHITECTURE §2.5, §2.6, §9.2; ADR-003; FR-6, FR-12, FR-13; NFR-3, NFR-4.

---

## Phase 5 — Snapshot contract, questionnaire CRUD & draft

**Goal:** The shared `QuestionnaireSnapshot` Zod contract and the mutable "head" CRUD (create, read, draft edit, delete) with authz — no publishing yet.

Steps:
- [ ] Define `shared/src/snapshot.ts` (`QuestionnaireSnapshot`: sections, questions + type-specific config, options, behavior flags, results messages; scale block stubbed) + Vitest contract tests.
- [ ] Implement `POST /api/questionnaires` (create head, owner=session, initial draft_snapshot) with Zod validation.
- [ ] Implement `GET /api/questionnaires/:id` (per visibility/role) + `GET /api/q/link/:token` (private-link read) with unguessable token generation.
- [ ] Implement `PATCH /api/questionnaires/:id` (draft edit → validate + sanitize draft_snapshot) — owner guard.
- [ ] Implement `DELETE /api/questionnaires/:id` — owner-or-moderator/admin guard; Vitest for CRUD + authz matrix.

**Dependencies:** Phase 4 (sanitizer for snapshot content), Phase 3 (guards, ownership), Phase 2 (questionnaires table).
**Acceptance signal:** an authed (incl. anon) user creates/edits/deletes their own questionnaire; moderator/admin can delete any; private-link read works; snapshot validated/sanitized on write — Vitest-covered.
**Maps to:** ARCHITECTURE §3.2, §3.10, §6.2, §6.4(questionnaires); ADR-004, ADR-009; FR-8..FR-13, FR-18, §2.2 matrix; NFR-2, NFR-3, NFR-7.

---

## Phase 6 — Publishing & versioning

**Goal:** Immutable version snapshots on publish; edits produce new versions; version listing/reads.

Steps:
- [ ] Implement `services/versioning.service.ts` + `POST /api/questionnaires/:id/publish` (validate draft_snapshot → insert version `n+1` → set current_version_id).
- [ ] Implement `GET /api/questionnaires/:id/versions` + `GET /api/versions/:versionId` (read per visibility).
- [ ] Vitest: publish creates immutable snapshot; re-publish after edit creates a new version with prior versions untouched (FR-25/26 acceptance).

**Dependencies:** Phase 5 (draft_snapshot + snapshot contract), Phase 2 (questionnaire_versions table).
**Acceptance signal:** publishing snapshots the draft into an immutable version; editing + re-publishing yields a new version number while old versions remain intact — Vitest-covered.
**Maps to:** ARCHITECTURE §3.3, §3.10, §6.4(versions); ADR-004; FR-25, FR-26; NFR-8.

---

## Phase 7 — Answering, responses & auto-grading

**Goal:** Submit responses bound to a version; auto-grade Single/Multiple/Short for quizzes; store re-submissions as distinct rows.

Steps:
- [ ] Implement `POST /api/questionnaires/:id/responses` (answer against current version; persist response + answers; version-bound; each submit = new row).
- [ ] Implement `services/grading.service.ts` auto-grade for Single (exactly one) + Multiple (exact-set match) — sets `answers.auto_grade`.
- [ ] Add Short auto-grade (acceptable-answers match with per-question case toggle, trimmed) to the grading service + Vitest fixtures.
- [ ] Compute quiz `responses.score` + set `grading_status` (`na`/`pending`/`graded`) accounting for Long presence; `GET /api/responses/:id`.
- [ ] Implement survey submission path (no scoring, completion message) + Vitest for response persistence, re-submission rows, and each grading acceptance case.

**Dependencies:** Phase 6 (version to bind against), Phase 5 (snapshot question ids), Phase 3 (respondent identity).
**Acceptance signal:** Single/Multiple/Short auto-grade per SPEC rules; a response with an ungraded Long shows `pending`; re-submitting yields two rows; surveys end without scoring — Vitest-covered (FR-20/21/23/28 acceptance).
**Maps to:** ARCHITECTURE §3.4, §3.5, §4.3, §6.4(responses); FR-10, FR-20, FR-21, FR-23, FR-27, FR-28; NFR-8, NFR-10.

---

## Phase 8 — Manual grading (Long)

**Goal:** Author grades Long answers; response transitions pending → graded and score finalizes.

Steps:
- [ ] Implement `GET /api/questionnaires/:id/grading` (list responses with pending Long answers) — owner-or-admin guard.
- [ ] Implement `POST /api/responses/:id/grade` (record per-Long `manual_grade`; recompute `grading_status` + finalize `score`) via the grading service.
- [ ] Vitest: grading all Long answers flips a response from `pending` to `graded` with finalized score (FR-21/22 acceptance).

**Dependencies:** Phase 7 (responses/answers + pending status).
**Acceptance signal:** author grades all Long answers → response `graded`, score no longer pending — Vitest-covered.
**Maps to:** ARCHITECTURE §3.5, §6.4(grading); FR-21, FR-22; NFR-10.

---

## Phase 9 — Scale scoring

**Goal:** Multi-dimensional (MBTI-style) scoring: pole weights → winner-take-all/bands → outcome mapping, deterministic and version-bound.

Steps:
- [ ] Extend `shared/src/snapshot.ts` scale block (dimensions/poles, per-option weights, scoring mode, bands, outcomes, default outcome) + Zod tests.
- [ ] Implement `services/scale.service.ts`: aggregate pole scores, winner-take-all resolution, result-key outcome lookup.
- [ ] Add bands mode (normalized 0–100 dimension score → band outcome) + required default-outcome fallback.
- [ ] Wire scale scoring into response submit (produce `score = {dimensionScores, winningPoles, outcomeKey}`) + Vitest fixtures per mode (FR-24 acceptance).

**Dependencies:** Phase 7 (response submit pipeline), Phase 5/6 (snapshot + versions).
**Acceptance signal:** completing a Scale questionnaire returns the outcome per the author's dimension-weight-to-outcome mapping across both modes, deterministically — Vitest-covered.
**Maps to:** ARCHITECTURE §3.8, §4; ADR-005; FR-24; NFR-8, NFR-10.

---

## Phase 10 — Likes, Explore, categories & profiles

**Goal:** Like/unlike with atomic denormalized count, Explore ranking + filter + cursor pagination, categories read, and profile/settings data.

Steps:
- [ ] Implement `POST`/`DELETE /api/questionnaires/:id/like` (atomic `db.batch` insert/delete + like_count in/decrement, dedup by user id).
- [ ] Implement `services/explore.service.ts` + `GET /api/questionnaires` (public+published only, category filter, rank by like_count, cursor pagination 20/page) + `lib/pagination.ts` cursor.
- [ ] Implement `GET /api/categories` (with subcategories).
- [ ] Implement `GET /api/users/:username` (published + liked; drafts owner-only) + `PATCH /api/me` (password/email/avatar) settings.
- [ ] Vitest: like dedup (no double increment), Explore excludes private/drafts, cursor pagination, profile excludes drafts (FR-30/32/33/35/36 acceptance).

**Dependencies:** Phase 6 (published visibility), Phase 5 (questionnaire head), Phase 3 (user/likes), Phase 2 (categories seed).
**Acceptance signal:** liking dedups and updates count atomically; Explore ranks/filters/paginates and excludes private+drafts; profile shows published+liked only — Vitest-covered.
**Maps to:** ARCHITECTURE §3.7, §3.9, §6.4(likes/categories/profiles/settings); FR-5, FR-30..FR-36; NFR-9.

---

## Phase 11 — Admin API

**Goal:** Admin-only user administration and content oversight per the role matrix, enforced server-side.

Steps:
- [ ] Implement `GET /api/admin/users` + `POST /api/admin/users` (create Moderator/Admin) — `requireRole('admin')`.
- [ ] Implement `PATCH /api/admin/users/:id` + admin content actions (delete-any already via owner-or-role) + Vitest authz tests (moderator cannot edit others; admin full CRUD).

**Dependencies:** Phase 3 (roles/guards), Phase 5/6 (content actions).
**Acceptance signal:** only admins create mod/admin accounts and manage users; moderators can view/delete any but not edit others' content — Vitest-covered against the §2.2 matrix.
**Maps to:** ARCHITECTURE §6.2, §6.4(admin); FR-7, FR-43, §2.2 matrix; NFR-7.

---

## Phase 12 — Frontend base: Vite + Router + Query + Tailwind/shadcn + themes

**Goal:** A running SPA shell with routing, server-state, styling system, theming, and the API client — no feature pages yet.

Steps:
- [ ] Initialize `frontend/`: Vite + React + TS, Tailwind + shadcn/ui, Inter font, base `index.html`/`main.tsx`.
- [ ] Add Tanstack Router (`router.tsx` + `__root.tsx`, empty route tree) + Tanstack Query provider.
- [ ] Add `lib/api.ts` (fetch wrapper: `credentials: include`, error-envelope parsing) + a `/api/me` query hook.
- [ ] Add theming: `themes/*.css` token files (light default + dark) + manifest + `themeStore` (Zustand, persisted) + `data-theme` toggle.
- [ ] Add `/design-system` route (token palette + component gallery across themes) for visual QA.

**Dependencies:** Phase 1/3 (API + `/api/me` to call); Phase 0 (shared enums/types).
**Acceptance signal:** SPA builds and serves via Pages dev; theme switch toggles light/dark instantly; `/design-system` renders tokens; `/api/me` hydrates against the backend.
**Maps to:** ARCHITECTURE §7.1, §7.3, §7.4, §8.2; ADR-010; FR-37, FR-38, FR-39, FR-40; NFR-5, NFR-6.

---

## Phase 13 — Frontend shell: layouts, sidebar, header & auth screens

**Goal:** App/Bare layouts, collapsible sidebar, top-right header with theme switch + account menu, and working sign-in/sign-up.

Steps:
- [ ] Implement `AppLayout` (sidebar + header) + `BareLayout` (no sidebar) route groups; sidebar collapse persisted in `uiStore`.
- [ ] Implement top-right header: theme switch + custom-theme dropdown + account menu (hydrated from `/api/me`).
- [ ] Implement `/auth/sign-in` + `/auth/sign-up` (Tanstack Form + shared Zod; username-or-email; anon-merge on submit) under BareLayout.
- [ ] Add route guards (`beforeLoad` using `/api/me`) for role/visibility gating scaffolding.

**Dependencies:** Phase 12 (router, query, theme store, API client), Phase 3 (auth endpoints).
**Acceptance signal:** sidebar hides on auth screens; theme switch lives top-right; sign-up/sign-in work end-to-end and merge anon content; guards gate a protected route.
**Maps to:** ARCHITECTURE §7.1, §7.2, §7.3; FR-1..FR-5, FR-39; NFR-5, NFR-6, NFR-7.

---

## Phase 14 — Frontend builder (create/edit)

**Goal:** The questionnaire builder for all three types with drag-sortable sections/questions, the tiptap editor, behavior toggles, and client-side preview.

Steps:
- [ ] Add shared tiptap **editor** component (character-count, filehandler→upload, color) + **no-image** variant + read-only renderer.
- [ ] Implement `builderStore` (draft: sections/questions/options/positions/flags) enabling client-side Preview through to results (FR-29).
- [ ] Implement builder shell + `/q/new`, `/s/new`, `/scale/new` routes wiring create → draft.
- [ ] Implement Section + Question editors: Single/Multiple/Short/Long with type-specific config (options/correctness, acceptable answers + case toggle, optional flag).
- [ ] Add drag-sort (fractional index) for sections & questions **with an accessible keyboard alternative** (NFR-5).
- [ ] Add behavior toggles UI (one-at-a-time; paginated & fixed-answer gated on it; shows-answer-on-result; visibility) + results/outcome message editors.
- [ ] Add Scale authoring UI (dimensions/poles, per-option weights, outcome mapping/default) + `/q/$id/edit` load + save (PATCH) + publish.

**Dependencies:** Phase 12/13 (shell, editor deps, forms), Phase 5/6 (CRUD + publish API), Phase 4 (uploads), Phase 9 (scale contract).
**Acceptance signal:** author builds/edits a Quiz, Survey, and Scale; drag-reorders via mouse and keyboard; previews to the results screen from unsaved draft; saves draft and publishes a version.
**Maps to:** ARCHITECTURE §7.3(builderStore), §7.4(editor); FR-9..FR-17, FR-24, FR-29; NFR-3, NFR-5.

---

## Phase 15 — Frontend answering, results & grading UI

**Goal:** The answering experience (all navigation modes), results/outcome screens, and the manual grading UI.

Steps:
- [ ] Implement `/q/$id` answer view (BareLayout) + `quizTakingStore` (index, in-progress answers, progress bar reading theme token).
- [ ] Implement navigation modes: one-at-a-time; paginated jump-to-N; fixed-answer forward-only (hides back, overrides jump).
- [ ] Implement submit → results screens: quiz score (+shows-answer-on-result, pending state), survey completion, scale outcome; `/l/$token` private-link answering.
- [ ] Implement `/q/$id/grade` manual grading UI (list pending Long answers, grade, finalize).
- [ ] Component/interaction tests for answering navigation + results rendering (Vitest/RTL).

**Dependencies:** Phase 14 (published content to answer), Phase 7/8/9 (responses/grading/scale APIs).
**Acceptance signal:** answerer completes each type in each nav mode; results reflect score/pending/outcome and shows-answer setting; author grades Long answers and sees finalized score; private-link answering works.
**Maps to:** ARCHITECTURE §7.2, §7.3(quizTakingStore); FR-14..FR-22, FR-24, FR-27; NFR-5, NFR-6.

---

## Phase 16 — Frontend Explore, profiles, settings & blog

**Goal:** Discovery UI, profile/settings pages, and the build-time blog.

Steps:
- [ ] Implement `/explore` (infinite/cursor list, category filter, like button + optimistic count) via `useInfiniteQuery`.
- [ ] Implement `/user/$username` profile (published + liked tabs; drafts owner-only) + `/settings` (password/email/avatar; circular avatar).
- [ ] Implement blog build-time pipeline: Vite markdown/frontmatter plugin + `/blog` index + `/blog/$slug` post.

**Dependencies:** Phase 12/13 (shell), Phase 10 (explore/likes/profiles/settings/categories APIs), Phase 4 (avatar upload).
**Acceptance signal:** Explore ranks/filters/paginates and excludes private+drafts; liking updates the count; profile shows published+liked; settings edit password/email/avatar; blog renders from `.md` at build time.
**Maps to:** ARCHITECTURE §7.1, §7.4(blog); ADR-008; FR-5, FR-30..FR-36, FR-41, FR-42; NFR-6, NFR-9.

---

## Phase 17 — Frontend admin dashboard

**Goal:** The admin dashboard for user management and content oversight, shown on admin login.

Steps:
- [ ] Implement `/admin` dashboard (user list + create Moderator/Admin) gated by role.
- [ ] Implement admin content oversight actions (view/delete any) + "shown on login" routing for admins.

**Dependencies:** Phase 13 (guards/shell), Phase 11 (admin API).
**Acceptance signal:** an admin sees the dashboard on login, creates mod/admin accounts, and performs oversight actions; non-admins are gated out.
**Maps to:** ARCHITECTURE §6.4(admin), §7.1; FR-7, FR-43, §2.2 matrix; NFR-7.

---

## Phase 18 — Hardening: E2E, accessibility, environments & deploy

**Goal:** Critical-journey E2E coverage, an a11y/responsiveness pass, environment/CI wiring, and first deploy to preview/prod.

Steps:
- [ ] Playwright global setup: local miniflare D1 + migrations + seed (categories + first admin) + Pages dev; auth via real endpoints.
- [ ] E2E: anonymous create → answer → like; sign-up merge; quiz grading pending→graded.
- [ ] E2E: scale outcome; Explore filter/pagination; private-link access.
- [ ] Accessibility + responsiveness pass across core flows (keyboard operability, labels/roles, contrast across themes; mobile layouts).
- [ ] CI wiring: lint + typecheck + Vitest + Playwright on PRs; preview D1/Worker/Pages env bindings.
- [ ] Deploy config finalize: prod domains (`app.`/`api.`), parent-domain cookies, CORS allowlist, secrets (`BETTER_AUTH_SECRET`, first-admin seed); first prod deploy.

**Dependencies:** all prior phases (E2E exercises the full stack).
**Acceptance signal:** all critical-journey E2E specs pass against a seeded local stack; a11y/responsive checks pass; CI green; preview + prod deploy succeed with correct cross-origin auth.
**Maps to:** ARCHITECTURE §1.2, §1.3, §9.6; ADR-006; NFR-5, NFR-6, NFR-7, NFR-10, NFR-11.

---

## Cross-cutting threads (woven through every phase)

- **Testing (NFR-10):** every logic-bearing step adds/updates Vitest (backend) or component tests (FE); Playwright journeys land in Phase 18 but are seeded by the flows built earlier. QA (`ai-qa`) runs after each `/implement`.
- **Docs & CONTEXT upkeep:** `docs-keeper` updates `CONTEXT.md`, `INDEX.md`, and affected docs after every implementation and on `/done` (context-recovery guarantee).
- **Sanitization & validation (NFR-2, NFR-3):** the tiptap allowlist sanitizer (Phase 4) and shared Zod validators (Phase 0/1) are reused by every content-writing route and every FE form thereafter.
- **R2 (ADR-003):** established in Phase 4; reused by builder image uploads (Phase 14) and avatars (Phase 16).
- **Authz (NFR-7):** guards from Phase 3 are applied on every sensitive route in Phases 5–11 and mirrored (never trusted) by FE guards in Phases 13–17.
- **Shared contract (ADR-007):** `@app/shared` schemas grow phase-by-phase (enums → error envelope → snapshot → scale → API bodies) and are the single source of truth for both sides.

---

## Sequencing rationale & phase dependencies

- **Backend before frontend.** The FE consumes a JSON API; building the API first (Phases 1–11) lets FE phases (12–17) integrate against real, tested endpoints, matching ARCHITECTURE §10.
- **Foundations → data → auth → content.** Nothing works without workspaces (0). The schema (2) must exist before auth-merge (3) can re-point rows. Content CRUD (5) needs auth ownership (3) and the sanitizer (4). Publishing (6) needs the draft+snapshot contract (5). Responses (7) need a version to bind to (6). Manual grading (8) and scale (9) extend the response pipeline (7).
- **Discovery after content.** Likes/Explore/profiles (10) need published content (6) and users (3). Admin (11) needs roles/guards (3) and content actions (5/6).
- **FE shell before FE features.** Router/query/theme/API (12) and layouts/auth (13) precede the builder (14), answering (15), discovery/profile/blog (16), and admin (17).
- **Hardening last.** E2E and deploy (18) validate the assembled stack end-to-end.

**Hard dependencies:** 0→1→2→3; 4 needs 3; 5 needs 3+4; 6 needs 5; 7 needs 6; 8 needs 7; 9 needs 7; 10 needs 6; 11 needs 3+5/6; 12 needs 1/3; 13 needs 12+3; 14 needs 13+5/6+4+9; 15 needs 14+7/8/9; 16 needs 13+10; 17 needs 13+11; 18 needs all.

---

## Open confirmations affecting the plan

ARCHITECTURE §11 lists decisions awaiting user confirmation (route naming OQ-1, email flows OQ-3, anon TTL OQ-5, R2 serving, scale default OQ-4, shared package OQ-2, domain names). These are baked into the phases above as the assumed path; if any is overturned, the affected phase's steps are revised before its tickets are created. No ticket should be created against an unconfirmed decision without the producer flagging it.
