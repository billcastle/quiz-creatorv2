# DECISIONS.md — Architecture Decision Records

Format per entry:

```
## ADR-### — <title>  (YYYY-MM-DD)
**Status:** accepted | superseded by ADR-###
**Context:** why this came up
**Decision:** what we chose
**Consequences:** trade-offs accepted
```

## ADR-001 — Monorepo with separately deployed frontend/backend (2026-07-02)
**Status:** accepted
**Context:** Initial user requirement.
**Decision:** Single repo with `frontend/` and `backend/` folders; each deploys independently but shares the ecosystem (and conventions, and possibly types — TBD in intake).
**Consequences:** Simple local dev and shared tooling; deployment pipelines must be kept independent per folder.

## ADR-002 — Cloudflare D1 as the only database, via Drizzle (D1 driver) (2026-07-02)
**Status:** accepted
**Context:** SPEC §1.1 / §6.2 sets D1 as the sole datastore; "sqlite" in the raw stack = D1. Need an ORM and a story for auth/session storage.
**Decision:** D1 (SQLite) is the single database for both app data and better-auth tables (`user`/`session`/`account`/`verification`). Access via Drizzle ORM's D1 driver. Local dev on miniflare local D1; migrations via `wrangler d1 migrations apply`. Follow D1 conventions: FKs always enforced; no native boolean/datetime/json (integer boolean/timestamp_ms, JSON-as-TEXT); text UUIDv7-style PKs; respect the 100 bound-parameter limit; no interactive transactions — use `db.batch()` for atomic multi-statement ops.
**Consequences:** One store, simple ops, cheap. No cross-DB joins/services. Must design around SQLite/D1 quirks (batching, JSON columns validated by Zod in code, param limits). Analytics that slice inside JSON columns are harder — acceptable for MVP.

## ADR-003 — Cloudflare R2 for uploads, served via a Worker proxy route (2026-07-02)
**Status:** accepted
**Context:** SPEC FR-6/FR-12, NFR-4 require image uploads (tiptap images ≤5 MB, avatars ≤10 MB) with server-side type/size validation.
**Decision:** Store uploads in R2. Two auth-required endpoints validate content-type + real byte length (and sniff magic bytes) before writing. Objects served back through a Worker route `GET /api/files/:key+` (streamed with correct content-type + cache headers) rather than a public bucket, so there is a single CORS origin and no public bucket exposure.
**Consequences:** Tight validation and one origin; slightly more Worker traffic for reads. A public-read bucket + CDN/custom domain remains a later performance optimization. Orphaned-upload cleanup deferred (out of MVP scope).

## ADR-004 — Versioning via full-JSON immutable snapshots (not normalized versioned rows) (2026-07-02)
**Status:** accepted
**Context:** SPEC FR-25/26/27 require publishing to create an immutable version, edits to create new versions, and responses to bind to the version they answered. Options: (a) normalize sections/questions/options into versioned child tables, or (b) store each version as one JSON document.
**Decision:** Each published version is ONE immutable row in `questionnaire_versions` with a `snapshot` JSON column holding the entire authored content (sections, questions, options, correctness, acceptable answers, case toggle, optional flags, positions, behavior flags, results/outcome messages, and — for scale — dimensions/weights/outcome mapping). The in-progress edit lives in `questionnaires.draft_snapshot`. Answers reference question ids embedded in the snapshot. The snapshot shape is a shared Zod schema (`QuestionnaireSnapshot`) validated on write.
**Consequences:** Immutability is guaranteed and reads are a single row (no multi-join reconstruction), which suits D1 (avoids N inserts + param limits per publish). The version "schema" lives in code (Zod), not table columns; slicing inside snapshots needs JSON extraction. Accepted because we always fetch a whole version and MVP has no in-snapshot analytics need.

## ADR-005 — Scale scoring model: winner-take-all per dimension → result-key outcome (resolves OQ-4) (2026-07-02)
**Status:** accepted
**Context:** OQ-4 asked for concrete MBTI-style scoring semantics beyond "winning/combined dimension scores."
**Decision:** Author-defined dimensions, each with one or more named **poles**. Every answer option carries a `weights` map (pole → number). Response pole totals = sum of weights over selected options. Default resolution is **winner-take-all per dimension** (highest-scoring pole wins; ties broken by an author `tieBreak` then declaration order), producing a concatenated **result key** (e.g. "ESTJ"). Outcomes are keyed by result key and looked up exactly. An optional per-dimension **bands** mode maps a normalized 0–100 dimension score to an outcome. A required **default outcome** guarantees every completion maps to something. Scoring runs server-side and is deterministic against the immutable snapshot.
**Consequences:** Covers classic MBTI-style typing and simple single-axis banding with one model. Authors must define outcomes for the combinations they care about plus a default. Fully reproducible per version. Continuous/weighted-blend outcomes are out of scope for MVP.

## ADR-006 — Auth topology: better-auth on Workers, parent-domain cookies, anonymous + username plugins, account merge (2026-07-02)
**Status:** accepted
**Context:** SPEC FR-1..FR-5, §6.1: every visitor gets a real anonymous identity; registered users log in with username OR email; anonymous content merges into the registered account on auth; FE and BE are separate origins.
**Decision:** better-auth runs in the Worker with a Drizzle/D1 adapter and sessions in D1. Enable the `anonymous` plugin (real anon user + session on first visit) and the `username` plugin (username-or-email login; username unique + immutable). FE (`app.`) and BE (`api.`) share a parent domain; the session cookie uses `Domain=.<parent>`, `HttpOnly`, `Secure`, `SameSite=None` in prod; the Worker CORS allowlists the FE origin explicitly with credentials; FE calls with `credentials: "include"`. On sign-up/sign-in the `anonymous` plugin's link hook triggers a merge (`auth/merge.ts`) that re-points `questionnaires.owner_id`, `responses.respondent_user_id`, and `likes.user_id` (dedup colliding likes) to the target user in a single atomic `db.batch`, then deletes the anon user + sessions. Email verification/reset and any mailer are out of scope for MVP.
**Consequences:** Frictionless anonymous usage with stable ownership and clean merges. Cross-origin cookie config must be exact (SameSite=None+Secure in prod, correct trustedOrigins). No password recovery in MVP — flagged for confirmation (OQ-3). Merge relies on batch atomicity rather than interactive transactions (D1 constraint).

## ADR-007 — Shared types & Zod in a root `shared/` workspace package (resolves OQ-2) (2026-07-02)
**Status:** accepted
**Context:** OQ-2 / ADR-001 left shared-types placement open. CLAUDE.md mandates FE code in `frontend/`, BE code in `backend/`.
**Decision:** Add a third workspace `shared/` (`@app/shared`) at the repo root holding ONLY TypeScript types and Zod schemas (API request/response bodies, the `QuestionnaireSnapshot` contract, the error envelope, enums, pagination cursors) — no FE/BE runtime app logic. Both apps depend on it via workspaces. The backend validates inbound requests with these schemas; the frontend uses the same schemas for form validation and response typing. No codegen. Drizzle row types stay backend-only; the boundary is the `shared/` contract types, not DB types.
**Consequences:** One source of truth, zero contract drift, type-safety without an RPC client or generator. Adds a workspace and requires bundlers on both sides to consume TS from `shared/`. `shared/` is neither app's code, satisfying the folder-separation rule (flagged for confirmation as a reading of that rule).

## ADR-008 — Blog as a build-time Markdown pipeline (no DB, no CRUD) (2026-07-02)
**Status:** accepted
**Context:** SPEC FR-41/42, §8: blog posts are `.md` files rendered at build time; no authoring UI or DB storage in MVP.
**Decision:** Blog posts are `.md` files under `frontend/src/content/blog/`. A Vite plugin parses frontmatter + renders markdown at build time into route data for `/blog` (index) and `/blog/$slug` (post). No backend involvement, no DB tables.
**Consequences:** Zero runtime/DB cost, versioned with the repo. Publishing requires a rebuild/redeploy of the frontend; no dynamic authoring. Acceptable for MVP.

## ADR-009 — API style: REST resource routes with shared Zod validation (no RPC client) (2026-07-02)
**Status:** accepted
**Context:** Need a contract style between FE and BE that is testable, type-safe, and matches Tanstack Query usage.
**Decision:** Plain REST resource routes on Hono, each validated with `@hono/zod-validator` using `@app/shared` schemas. A standard error envelope `{ error: { code, message, details? } }` with documented codes/HTTP statuses. Do NOT adopt Hono RPC/`hc` for MVP — type-safety comes from shared Zod types instead, keeping the contract explicit and framework-agnostic.
**Consequences:** Simple, cache/proxy-friendly, easy to test (`npx hono request`, Playwright) and maps cleanly to Tanstack Query. Slightly less end-to-end inferred typing than an RPC client, offset by shared schemas. Revisitable later if tighter coupling is wanted.

## ADR-010 — Theming via build-time CSS custom-property token files + runtime switch (2026-07-02)
**Status:** accepted
**Context:** SPEC FR-37/38/39, §8: shadcn-style themes as committed token files; light default + dark; a top-right switch; "add a theme" = add a token file. No runtime user-uploaded themes.
**Decision:** Themes are CSS custom-property token files under `frontend/src/themes/`, bundled at build time and listed in a manifest. A runtime switch toggles a `data-theme`/class on `<html>`; the active choice is persisted in a Zustand `themeStore`. All component colors (incl. the quiz progress bar) derive from tokens. Base font Inter.
**Consequences:** Simple, fast, versioned themes; adding one is a token file + manifest entry. No dynamic/user-uploaded themes (out of scope). Runtime switching is instant with no reload.
