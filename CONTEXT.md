# CONTEXT.md — Project State Snapshot

> Purpose: If the Claude Code context is cleared, attach this file to get the agent back on track.
> The `docs-keeper` subagent MUST update this file after every ticket implementation and on every `/done`.
> Keep it short — this is a snapshot, not a history. Full history lives in `docs/tickets/` and git.

## 1. What this project is

A questionnaire creator web app: users create, publish, and answer quizzes, surveys, and MBTI-style scale tests.
Monorepo: `frontend/`, `backend/`, `shared/` (FE + BE deployed separately, same ecosystem). TypeScript everywhere, strict mode.

## 2. Current status

- **Phase:** Phase 0 done; frontend foundation + design system + app shell landed (TICKET-003..005); backend **Phase 1 (backend base) DONE** — Worker skeleton (006) plus the structured Hono app + middleware + error envelope + workers-pool test harness (007). Next: **Phase 2 (data layer)**.
- **Current ticket:** none active. TICKET-007 (backend base) is **DONE 2026-07-03** (ai-devops still to record the PR link in the ticket + INDEX).
- **Last completed ticket:** TICKET-007 (backend base) — **DONE 2026-07-03**.
- **Current branch:** ticket/007-backend-base-app-middleware-error-envelope.

## 3. Tech stack (confirmed at intake)

- **Frontend:** Vite + React + TypeScript SPA on Cloudflare Pages (`app.<domain>`). Tanstack Router + Tanstack Query, Tanstack Form. Zustand for UI/theme/builder/quiz-taking state. Tailwind + shadcn/ui, base font Inter. tiptap editor (character-count, filehandler, color). **Foundation in place (TICKET-003):** Vite 8 + React 19, Tailwind v4 via `@tailwindcss/vite`, shadcn (`.dark` class theme mechanism), Inter via `@fontsource/inter`, Tanstack Router (file-based, generated `routeTree.gen.ts`), Vitest + RTL smoke test. **Design system exists (TICKET-004, DONE):** `/design-system` route with Colors / Typography / Components sections (12 shadcn primitives: Button, Input, Label, Textarea, Select, Checkbox, RadioGroup, Switch, Card, Tabs, Badge, Separator) and an anti-FOUC inline script in `index.html`; `lucide-react` added for icons. **Persistent app shell exists (TICKET-005, DONE):** `_app`/`_bare` pathless-layout split (flat dotted route files). `AppLayout` = collapsible custom sidebar (nav links + static Categories section + minimize-to-icons rail, collapsed state persisted via Zustand `ui` store, key `qc-ui`) + `Header` (light/dark toggle + `Select` custom-theme dropdown driven by `themes/manifest.ts`). `BareLayout` = chrome-free slot for future auth/answering (with a temporary `/placeholder` route to be removed when auth lands). `lib/theme.ts` generalized for named themes via `[data-theme]` on `<html>` (still `.dark` for the dark built-in), with the anti-FOUC inline script in lockstep. `zustand@5.0.14` (exact) added. The TICKET-004 in-page demo theme toggle was removed — the header is now the canonical theme control.
- **Backend:** Cloudflare Worker running Hono (`api.<domain>`). REST routes validated with `@hono/zod-validator`. **Structured app in place (TICKET-007, DONE):** `backend/src/index.ts` is a thin entry delegating to a `createApp()` factory in `backend/src/app.ts` (typed `Hono<{ Bindings: Env; Variables: Variables }>`, middleware order CORS → request-id → logger, `onError`, registers only `GET /api/health` → `{ status: "ok" }`). `backend/src/env.ts` = `Env`/`Variables` types anticipating `DB: D1Database` / `BUCKET: R2Bucket` / `BETTER_AUTH_SECRET` / `CORS_ALLOWED_ORIGINS` + lazy `parseConfig`/`configSchema`. Middleware: `cors.ts` (function allowlist + credentials, never `*`, fallback `http://localhost:5173`), `error-handler.ts` (`onError` → `AppError` + `ZodError`→422 + generic 500 no-leak), `validate.ts` (zValidator wrappers throwing `AppError('VALIDATION_ERROR')`). `backend/src/lib/error.ts` = `AppError` + `toEnvelope`. Test harness migrated to `@cloudflare/vitest-pool-workers` (runs in workerd/miniflare) via `backend/vitest.config.ts` (`cloudflareTest({ wrangler: { configPath } })` plugin — the `defineWorkersConfig`/`/config` export is gone in 0.18) with `test/{health,cors,error-envelope,validate,env}.test.ts` (9/9 green, `SELF.fetch`). `@app/shared` is now a **live workspace dep** of backend (error-envelope contract). D1/R2 `wrangler.toml` bindings + `[env.*]` + `.dev.vars` are DEFERRED to Phase 2 (only `env.ts` types anticipate them). New deps (exact): `zod@4.4.3` (v4 — backend + shared, dedupes to one copy), `@hono/zod-validator@0.8.0`, `@cloudflare/vitest-pool-workers@0.18.0`. Existing pins unchanged: `hono@4.12.27`, `wrangler@4.107.0`, `@cloudflare/workers-types@5.20260703.1`, `vitest@4.1.9`.
- **Database:** Cloudflare D1 (SQLite) — the ONLY datastore, app data + auth/session tables. Drizzle ORM (D1 driver).
- **Auth:** better-auth in the Worker (Drizzle/D1 adapter) with `anonymous` + `username` plugins; parent-domain cookies.
- **Object store:** Cloudflare R2 (tiptap images + avatars), served via Worker proxy route.
- **Testing:** Vitest (backend unit + route via `@cloudflare/vitest-pool-workers`/miniflare; FE component) + Playwright E2E.
- **Deploy:** Pages (FE) + Worker (BE) on Cloudflare; local dev via `wrangler dev` + miniflare local D1.

## 4. Key confirmed product decisions (from intake)

- **Auth model:** every visitor becomes a real anonymous user on first visit; registered users log in by **username OR email** (username unique + immutable). On sign-up/sign-in, anonymous content **merges** into the registered account.
- **Scale scoring:** multi-dimensional MBTI-style. Author-defined dimensions/poles; per-option weight vectors; **winner-take-all per dimension → concatenated result-key outcome lookup** (default), optional per-dimension **bands** mode, required **default outcome**.
- **Versioning:** publishing snapshots the entire authored content as ONE immutable **full-JSON** version row; edits produce new versions; responses bind to the version they answered.
- **Grading:** Single/Multiple/**Short** auto-graded (Short = multiple acceptable answers + per-question case-sensitivity toggle, trimmed). **Long** is manually graded — response stays `pending` until all Long answers are graded, then `graded` with finalized score. Surveys/scales = `na`.

## 5. Key technical decisions / ADRs (one-liners — see `docs/DECISIONS.md`)

- **ADR-001** Monorepo, FE/BE deployed separately.
- **ADR-002** D1 (SQLite) as the only DB via Drizzle; D1 quirks (int booleans/timestamps, JSON-as-TEXT, FKs always on, 100-param limit, `db.batch` not interactive txns).
- **ADR-003** R2 for uploads, served through a Worker proxy route (`GET /api/files/:key+`), not a public bucket.
- **ADR-004** Versioning via full-JSON immutable snapshots (not normalized versioned rows).
- **ADR-005** Scale scoring: winner-take-all per dimension → result-key outcome (optional bands + required default). Resolves OQ-4.
- **ADR-006** Auth topology: better-auth on Workers, parent-domain cookies (`SameSite=None;Secure` in prod), anonymous + username plugins, atomic account merge.
- **ADR-007** Shared types + Zod in a root `shared/` (`@app/shared`) workspace — one contract, no codegen. Resolves OQ-2.
- **ADR-008** Blog = build-time Markdown pipeline (no DB, no CRUD).
- **ADR-009** API = REST resource routes + shared Zod validation + standard error envelope (no Hono RPC/`hc`).
- **ADR-010** Theming = build-time CSS custom-property token files + runtime `data-theme` switch (light default + dark).
- **ADR-011** Biome as the single formatter + linter (replaces ESLint + Prettier); reconciles the historical ROADMAP Phase 0 line.

## 6. Canonical docs (source of truth)

- `docs/SPEC.md` — requirements (FR-*, NFR-*, OQ-*).
- `docs/ARCHITECTURE.md` — system design (§11 = open confirmations).
- `docs/DECISIONS.md` — ADR-001..011.
- `docs/ROADMAP.md` — 19 phases (0–18), ~92 prospective ticket-sized steps, backend-first.
- `docs/WORKFLOW.md` — the per-ticket feature-dev workflow.
- `docs/tickets/INDEX.md` — ticket status tracker (TICKET-001..007 DONE).

## 7. Roadmap summary

- **19 phases (0–18), ~92 prospective steps, backend-first.** Phase order: foundations → backend base → data layer → auth/merge → uploads/sanitize → CRUD/draft → publish/versioning → responses/auto-grade → manual grading → scale → likes/explore/profiles → admin API → FE base → shell/auth → builder → answering/results/grading UI → explore/profiles/settings/blog → admin UI → hardening/E2E/deploy.
- **Note:** original order was backend-first; per user pivot the frontend foundation (Phase 12 base) was pulled earlier to enable design-system work. Backend Worker skeleton is deferred to a later ticket.

## 8. Still awaiting user confirmation (ARCHITECTURE §11 / SPEC OQ-1..5)

Baked into the roadmap as the assumed path; overturning any revises the affected phase before its tickets are created:
1. **Route naming (OQ-1):** `/scale/new`, `/q/$id/edit`, `/q/$id/grade`, `/l/$token` private links, `/auth/sign-in|sign-up`.
2. **Email flows (OQ-3):** MVP ships no password reset/verification and no mailer — confirm acceptable.
3. **Anonymous content TTL (OQ-5):** no cleanup/retention for never-merged anon content in MVP.
4. **File serving:** Worker-proxied R2 reads (not a public bucket).
5. **Scale scoring default (OQ-4 / ADR-005):** winner-take-all → result-key + optional bands + default outcome.
6. **Shared package (OQ-2 / ADR-007):** root `shared/` workspace as an acceptable reading of the "FE in frontend/, BE in backend/" rule.
7. **Domain names:** actual `app.`/`api.` parent domain when provisioning.

## 9. What's done

- Intake (SPEC/ARCHITECTURE/DECISIONS/ROADMAP) is complete.
- **TICKET-001** — monorepo root + npm workspaces (frontend/backend/shared), Node 22 pins, hygiene files. DONE 2026-07-02 (PR #1).
- **TICKET-002** — strict `tsconfig.base.json` + per-workspace tsconfigs, Biome 1.9.4 (format + lint + organizeImports), TypeScript 5.9.3, real root scripts (format/lint/typecheck). DONE 2026-07-02 (PR #2).
- **TICKET-003** — frontend foundation (Vite 8 + React 19, Tailwind v4, shadcn init + Button, Inter via `@fontsource`, light/dark theme tokens + `.dark` mechanism, Tanstack Router file-based + AppLayout shell, Vitest+RTL smoke test). DONE 2026-07-03 (PR #3).
- **TICKET-004** — design-system page (`/design-system`): Colors / Typography / Components (12 shadcn primitives), in-page theme toggle, anti-FOUC script, lucide-react icons; RadioGroup + Checkbox multi-select styled as answer cards (questionnaire answer-option pattern). DONE 2026-07-03 (PR #4).
- **TICKET-005** — app shell: `_app`/`_bare` layout split, collapsible sidebar (Zustand ui store `qc-ui`), header theme switcher (light/dark + `Select` custom-theme dropdown), `lib/theme.ts` named-theme generalization + anti-FOUC lockstep, dark theme retuned for control visibility. DONE 2026-07-03 (PR #5).
- **TICKET-006** — backend Worker + Hono skeleton: `GET /api/health` → `{ status: "ok" }`, `wrangler.toml` (no bindings), backend `tsconfig` + `@cloudflare/workers-types`, offline Vitest smoke test. DONE 2026-07-03.
- **TICKET-007** — backend base: `createApp()` factory (`app.ts`) split from thin `index.ts`; CORS + request-id + logger middleware; central `onError` error handler + shared error envelope (`@app/shared` `api/common.ts`: `ERROR_STATUS`, `ErrorCode`, `errorEnvelopeSchema`); `env.ts` `Env`/`Variables` types anticipating D1/R2/secrets; `validate.ts` zValidator helper (→ 422); workers-pool (workerd/miniflare) test harness (9/9 tests). New deps `zod@4.4.3`, `@hono/zod-validator@0.8.0`, `@cloudflare/vitest-pool-workers@0.18.0`. D1/R2 `wrangler.toml` bindings + `[env.*]` + `.dev.vars` DEFERRED to Phase 2. DONE 2026-07-03 (PR link pending from ai-devops).

## 10. What's next

- **TICKET-007 is DONE.** Still outstanding at commit time: ai-devops records the PR link in the ticket file + INDEX row (both currently `—`), and keeps the untracked `.claude/agents/expert-react-frontend-engineer.md` (belongs to TICKET-005) out of the TICKET-007 commit.
- **`/next-ticket` → Phase 2 (data layer)** is the natural next step: D1/Drizzle schema + `db/client.ts` + first migration + seed, and flipping on the real `wrangler.toml` D1/R2 bindings + `[env.preview]`/`[env.production]` + `.dev.vars` template deferred by 007. Other open candidates:
  1. **Auth** (Phase 3, better-auth) — wires in `BETTER_AUTH_SECRET`/`parseConfig`, auth-context middleware (stack step 3), `/api/me`; pairs with auth pages under `_bare`.
  2. **A frontend feature page** (Explore / builder), or **design-system batch 2** (deferred overlay/portal primitives: Dialog, Tooltip, DropdownMenu, Popover, Sheet, Toast, Slider, Progress, Accordion, Avatar, Command, Table, Skeleton).
- **Open follow-up (from 007):** optionally enrich the request logger with the request-id (currently built-in `hono/logger`, no id in the line).
- **Open follow-up:** decide the canonical form-field label association pattern (nesting vs `htmlFor`+`id`) before builder/forms tickets copy it (two styles currently coexist on the showcase page).
- Consider confirming the §8 open items (esp. domains, scale default, shared-package reading) as later phases approach.

## 11. Gotchas / things the agent must remember

- One ticket at a time; the user gates all transitions. QA passing ≠ done.
- Never commit/push/PR before the user runs `/done`.
- FE code only in `frontend/`, BE only in `backend/`; shared types/Zod only in `shared/`.
- D1: no interactive transactions (use `db.batch`), FKs always enforced, 100 bound-param limit, JSON-as-TEXT validated by Zod in code.
- Cross-origin auth cookie config must be exact (`SameSite=None;Secure` + explicit CORS allowlist in prod).
- Read `CLAUDE.md` and `docs/WORKFLOW.md` for the full process.

## 12. How to resume after a context reset

1. Read this file fully.
2. Read `docs/tickets/INDEX.md` and the current ticket file (none yet).
3. Skim `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` for detail as needed.
4. Run `git status` and `git log --oneline -10` to see the actual repo state.
5. Confirm your understanding with the user in 2-3 sentences before doing anything.
