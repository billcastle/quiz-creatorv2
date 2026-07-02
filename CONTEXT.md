# CONTEXT.md — Project State Snapshot

> Purpose: If the Claude Code context is cleared, attach this file to get the agent back on track.
> The `docs-keeper` subagent MUST update this file after every ticket implementation and on every `/done`.
> Keep it short — this is a snapshot, not a history. Full history lives in `docs/tickets/` and git.

## 1. What this project is

A questionnaire creator web app: users create, publish, and answer quizzes, surveys, and MBTI-style scale tests.
Monorepo: `frontend/`, `backend/`, `shared/` (FE + BE deployed separately, same ecosystem). TypeScript everywhere, strict mode.

## 2. Current status

- **Phase:** Phase 0 — foundations. Monorepo skeleton now exists (npm workspaces: `frontend`, `backend`, `shared`; Node 22 pinned; hygiene files added).
- **Current ticket:** none in progress — awaiting `/next-ticket`.
- **Last completed ticket:** TICKET-001 (Initialize monorepo root & npm workspaces) — **DONE 2026-07-02**.
- **Current branch:** ticket/001-monorepo-workspaces.
- **Git note:** repo is being git-initialized by `ai-devops` as part of THIS `/done` (in progress now) — `git init` + branch `ticket/001-monorepo-workspaces`, then commit/push/PR.

## 3. Tech stack (confirmed at intake)

- **Frontend:** Vite + React + TypeScript SPA on Cloudflare Pages (`app.<domain>`). Tanstack Router + Tanstack Query, Tanstack Form. Zustand for UI/theme/builder/quiz-taking state. Tailwind + shadcn/ui, base font Inter. tiptap editor (character-count, filehandler, color).
- **Backend:** Cloudflare Worker running Hono (`api.<domain>`). REST routes validated with `@hono/zod-validator`.
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

## 6. Canonical docs (source of truth)

- `docs/SPEC.md` — requirements (FR-*, NFR-*, OQ-*).
- `docs/ARCHITECTURE.md` — system design (§11 = open confirmations).
- `docs/DECISIONS.md` — ADR-001..010.
- `docs/ROADMAP.md` — 19 phases (0–18), ~92 prospective ticket-sized steps, backend-first.
- `docs/WORKFLOW.md` — the per-ticket feature-dev workflow.
- `docs/tickets/INDEX.md` — ticket status tracker (empty; no tickets yet).

## 7. Roadmap summary

- **19 phases (0–18), ~92 prospective steps, backend-first.** Phase order: foundations → backend base → data layer → auth/merge → uploads/sanitize → CRUD/draft → publish/versioning → responses/auto-grade → manual grading → scale → likes/explore/profiles → admin API → FE base → shell/auth → builder → answering/results/grading UI → explore/profiles/settings/blog → admin UI → hardening/E2E/deploy.
- **Next step (first Phase 0 item):** initialize repo root — `package.json` with `frontend`/`backend`/`shared` workspaces, `.gitignore`, `.editorconfig`, Node/PM pin.

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
- **TICKET-001** — monorepo root + npm workspaces (frontend/backend/shared), Node 22 pins, hygiene files. DONE 2026-07-02.

## 10. What's next

- **Next: `/next-ticket` → TICKET-002:** TypeScript base config (`tsconfig.base.json` + per-workspace tsconfigs) + Biome (formatter/linter) install & config, plus real root scripts.
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
