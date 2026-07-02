# TICKET-001 — Initialize monorepo root & npm workspaces

- **Status:** DONE <!-- CREATED | IN PROGRESS | QA | AWAITING APPROVAL | DONE -->
- **Created:** 2026-07-02
- **Completed:** 2026-07-02
- **Branch:** ticket/001-monorepo-workspaces
- **PR:** https://github.com/billcastle/quiz-creatorv2/pull/1
- **Area:** repo
- **Depends on:** none (first ticket)

## Goal
Stand up the empty monorepo skeleton so every later ticket has a home: a root `package.json` declaring npm workspaces across `frontend/`, `backend/`, and `shared/`, plus repo-hygiene files (`.gitignore`, `.editorconfig`) and Node/package-manager version pins. This is the first unchecked Phase 0 step and unblocks all subsequent work.

## Scope
**In scope:**
- Root `package.json` with:
  - `"private": true`, `"name": "questionnaire-creator"` (or similar root name), `"type": "module"`.
  - `"workspaces": ["frontend", "backend", "shared"]` (npm workspaces per ADR-007 / ARCHITECTURE §5).
  - `"engines"` field pinning Node (e.g. `">=20"`) and npm, consistent with the version pin files below.
  - `"packageManager"` field pinning the npm version (Corepack-compatible), matching the chosen package manager (npm per ARCHITECTURE §5 default).
  - Placeholder root scripts ONLY as pass-throughs / no-ops that will be fleshed out in later tickets (e.g. `"lint": "echo \"configured in TICKET-002\" && exit 0"` style placeholders, or `--workspaces --if-present` delegators). Do NOT wire real lint/typecheck/build commands here — that is TICKET-002.
- Create the three workspace directories so `npm install` resolves them. Each gets a MINIMAL placeholder `package.json` sufficient for workspace resolution only:
  - `shared/package.json` — name `@app/shared`, `"private": true`, `"type": "module"`, `"version": "0.0.0"`. (No `src/`, no `exports`, no code yet — that is a later Phase 0 step.)
  - `frontend/package.json` — name `@app/frontend`, `"private": true`, `"type": "module"`, `"version": "0.0.0"`.
  - `backend/package.json` — name `@app/backend`, `"private": true`, `"type": "module"`, `"version": "0.0.0"`.
  - Add a `.gitkeep` (or a one-line `README.md` stub) inside each workspace dir if needed so the directory is tracked.
- `.gitignore` at repo root covering: `node_modules/`, build output dirs (`dist/`, `.wrangler/`, `.vite/`), env/secret files (`.dev.vars`, `.env*`), OS/editor cruft (`.DS_Store`), coverage/test artifacts, and log files.
- `.editorconfig` at repo root (UTF-8, LF line endings, final newline, 2-space indent for TS/JS/JSON, trim trailing whitespace).
- `.nvmrc` at repo root pinning the Node major version, consistent with `engines.node`.
- Confirm/leave in place the existing `docs/tickets/_TEMPLATE.md` and `docs/tickets/INDEX.md` (already present — no changes needed beyond the INDEX status row for this ticket).

**Out of scope (future tickets — do NOT touch):**
- Root TypeScript base config (`tsconfig.base.json`) and per-workspace tsconfigs → next Phase 0 step (TICKET-002).
- Lint/format tooling install & config (Biome as formatter/linter) and real root scripts → next Phase 0 step (TICKET-002).
- `shared/src/index.ts`, `shared/src/enums.ts`, or any Zod schemas/types → later Phase 0 steps.
- Installing ANY app frameworks or libraries: Vite/React, Tailwind/shadcn, Tanstack, Hono, Wrangler, Drizzle, better-auth, Zod, etc. — none of these are added in this ticket.
- D1/Drizzle, R2, auth, migrations, seed, or any feature/runtime code.
- CI/CD, deploy config, `wrangler.toml`, `vite.config.ts`, `drizzle.config.ts`.
- `docs/CONTEXT.md` skeleton (separate later Phase 0 step).

## Technical notes (architect)
- **Topology (ARCHITECTURE §1):** frontend and backend deploy independently but live in one repo and share conventions and the `@app/shared` contract. This ticket only establishes the shared repo root; deployment wiring comes much later (Phase 18).
- **Folder structure (ARCHITECTURE §8.1):** the repo root must match:
  ```
  /
    package.json          # workspaces: frontend, backend, shared
    docs/                 # already exists (SPEC, ARCHITECTURE, DECISIONS, tickets, CONTEXT)
    shared/               # @app/shared (types + zod) — populated later
    frontend/
    backend/
  ```
  Create `shared/`, `frontend/`, `backend/` as empty-but-resolvable workspaces now; their internal trees (§8.2/§8.3/§8.4) are built in later tickets.
- **Workspaces & `@app/shared` (ADR-007, ARCHITECTURE §5, line 368):** use **npm workspaces** with `"workspaces": ["frontend","backend","shared"]`. `@app/shared` will ship TS source consumed directly by the Vite/Wrangler bundlers — **no build step** and therefore **no `main`/`build` script** is required on it. For now it is just a resolvable package; do not add `exports`/`types` fields until `src/` exists (later ticket).
- **Monorepo (ADR-001):** single repo, separately deployed apps; keep tooling shared at the root. Root scripts should delegate to workspaces via `npm run <script> --workspaces --if-present` where used, but for this ticket keep them as harmless placeholders since no workspace defines real scripts yet.
- **TS strict (CLAUDE.md convention):** strict-mode TS is a hard project rule, but the base `tsconfig` that enforces it is deliberately deferred to TICKET-002 to keep this ticket to one focused session. Do not add any tsconfig here.
- **Biome (project tooling choice):** Biome will be the formatter/linter (installed & configured in TICKET-002). Do NOT install `@biomejs/biome` or add `biome.json` in this ticket.
- **Wrangler/Vite:** deferred to Phase 1 (backend init) and Phase 12 (frontend init) respectively — not here.
- **Version pinning:** `.nvmrc`, `engines.node`, and `packageManager` must all agree on the Node major (target an active LTS, e.g. Node 20/22 — implementer picks one LTS and keeps all three consistent). Use Corepack-style `packageManager` pin for npm.
- **No lockfile churn beyond workspaces:** `npm install` will create a root `package-lock.json` describing the three (dependency-free) workspaces; that lockfile is expected and should be committed.

## Acceptance criteria (ai-ba)
- [ ] **Given** a fresh clone at the repo root, **When** I run `npm install`, **Then** it completes with no errors and creates a single root `node_modules/` plus a root `package-lock.json`.
- [ ] **Given** the installed workspace, **When** I run `npm ls --workspaces` (or `npm query .workspace`), **Then** all three workspaces `@app/frontend`, `@app/backend`, and `@app/shared` resolve and are listed.
- [ ] **Given** the repo root, **When** I inspect `package.json`, **Then** it is `private: true`, declares `"workspaces": ["frontend","backend","shared"]`, and includes an `engines.node` pin plus a `packageManager` pin.
- [ ] **Given** the workspace dirs, **When** I inspect each of `frontend/`, `backend/`, `shared/`, **Then** each contains a minimal `package.json` (correct `@app/*` name, `private: true`, `type: module`) and NO app framework dependencies.
- [ ] **Given** `.nvmrc`, `engines.node`, and `packageManager`, **When** I compare them, **Then** they agree on the same Node major version.
- [ ] **Given** the repo root, **When** I inspect the tree, **Then** it matches ARCHITECTURE §8.1 (`package.json`, `docs/`, `shared/`, `frontend/`, `backend/`) with no extra top-level app files.
- [ ] **Given** a `.gitignore` at root, **When** I check its contents, **Then** it ignores `node_modules/`, build output (`dist/`, `.wrangler/`, `.vite/`), env/secret files (`.dev.vars`, `.env*`), and OS/editor cruft (`.DS_Store`).
- [ ] **Given** a `.editorconfig` at root, **When** I check its contents, **Then** it sets UTF-8, LF endings, final newline, trailing-whitespace trim, and 2-space indent for TS/JS/JSON.
- [ ] **Given** this ticket's scope, **When** I search the repo, **Then** there is NO `tsconfig*.json`, NO `biome.json`, NO `wrangler.toml`, NO `vite.config.ts`, NO `drizzle.config.ts`, and NO installed app frameworks (Vite/React/Hono/Wrangler/Drizzle/Tailwind/Tanstack/better-auth/Zod) anywhere.
- [ ] **Given** `shared/`, **When** I inspect it, **Then** there is NO `src/`, NO `enums.ts`, and NO Zod schemas yet (deferred to later Phase 0 steps).

## QA notes (ai-qa)
How to verify:
1. From the repo root run `npm install` — expect success, one root `node_modules/`, one root `package-lock.json` (no per-workspace lockfiles).
2. Run `npm ls --workspaces --depth=0` — confirm `@app/frontend`, `@app/backend`, `@app/shared` all appear and resolve.
3. Open the root `package.json` and confirm: `private: true`, `type: module`, `workspaces` array `["frontend","backend","shared"]`, `engines.node`, `packageManager`.
4. `node -v` against `.nvmrc` (via `nvm use` if available) — confirm the pinned major matches `engines.node` and `packageManager`.
5. Inspect each workspace `package.json` for correct `@app/*` name and `private: true`; confirm no `dependencies`/`devDependencies` blocks for app frameworks (empty or absent is expected).
6. Verify tree matches ARCHITECTURE §8.1; run a search to confirm NO `tsconfig*.json`, `biome.json`, `wrangler.toml`, `vite.config.ts`, `drizzle.config.ts` exist yet.
7. Confirm `.gitignore` and `.editorconfig` contents per acceptance criteria.
8. Edge cases: deleting `node_modules/` and re-running `npm install` should be reproducible; `git status` after install should show `package-lock.json` as the only generated tracked change (with `node_modules/` ignored).

## Implementation notes (filled after implementation)
- **Files touched:** root `package.json` (new), `shared/package.json` (new), `frontend/package.json` (new), `backend/package.json` (new), `.editorconfig` (new), `.nvmrc` (new, Node `22`), `.gitignore` (extended with `.vite/`, `.wrangler/`, `.dev.vars`, `.dev.vars.*`), root `package-lock.json` (generated). Node 22 / npm 10.9.4 pinned across `.nvmrc`, `engines.node` (>=22), and `packageManager` (npm@10.9.4).
- **Review verdict:** implemented directly by lead (trivial config scaffolding); self-reviewed against scope — within scope, no app frameworks added.
- **QA verdict:** PASS-WITH-NOTES — all 11 acceptance criteria PASS with live evidence (`npm install` clean, workspaces resolve to @app/frontend|backend|shared, single root lockfile, reproducible reinstall, no forbidden config files/frameworks). Notes: (a) repo is NOT a git repository yet — branching/commit prerequisites unmet; (b) pre-existing root `.DS_Store` present but correctly gitignored.
- **Follow-ups discovered (→ future tickets):** **git init** is a prerequisite before `/done` can commit/branch/PR (surface as its own small task or fold into devops on first /done); TS base config + Biome are TICKET-002 as planned.
