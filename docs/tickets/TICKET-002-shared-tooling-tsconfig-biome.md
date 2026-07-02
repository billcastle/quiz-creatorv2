# TICKET-002 — Shared tooling: strict TS base config + Biome + real root scripts

- **Status:** DONE <!-- CREATED | IN PROGRESS | QA | AWAITING APPROVAL | DONE -->
- **Created:** 2026-07-02
- **Completed:** 2026-07-02
- **Branch:** ticket/002-shared-tooling-tsconfig-biome
- **PR:** https://github.com/billcastle/quiz-creatorv2/pull/2
- **Area:** repo
- **Depends on:** TICKET-001 (DONE — monorepo root & npm workspaces)

## Goal
Establish the shared, framework-agnostic tooling layer for the monorepo: a strict-mode TypeScript base config extended by each workspace, Biome as the single formatter + linter at the repo root, and REAL root scripts (`format`, `lint`, `typecheck`) that replace the TICKET-001 placeholders. This is the second (and final) Phase 0 tooling step and lets every later ticket write TS that is type-checked, linted, and formatted consistently from day one.

## Scope
**In scope:**
- **Root `tsconfig.base.json`** — a strict-mode base config holding the common `compilerOptions` every workspace inherits. It defines *intent*; the implementer/architect finalizes exact values, but it MUST include (per CLAUDE.md TS-strict rule):
  - `"strict": true` (and therefore all its member flags).
  - `"noUncheckedIndexedAccess": true`.
  - `"noImplicitOverride": true`.
  - `"noFallthroughCasesInSwitch": true`.
  - `"exactOptionalPropertyTypes": true` (recommended; implementer may relax with a comment if it proves impractical for a downstream framework config — but strict/noUncheckedIndexedAccess are non-negotiable).
  - Modern module settings appropriate for a Vite + Cloudflare Worker + shared-TS monorepo: `"target": "ESNext"` (or current-LTS-safe ESNext), `"module": "ESNext"`, `"moduleResolution": "Bundler"`, `"verbatimModuleSyntax": true`, `"esModuleInterop": true`, `"resolveJsonModule": true`, `"skipLibCheck": true`, `"isolatedModules": true`, `"forceConsistentCasingInFileNames": true`.
  - `"noEmit": true` (type-check-only base; app/framework tickets add their own emit/bundler-specific settings later).
  - No `lib`/`types`/`jsx` framework specifics here — those belong to the per-app tickets (Phase 1 Worker types, Phase 12 Vite/React DOM libs).
- **Per-workspace `tsconfig.json`** in `frontend/`, `backend/`, `shared/`, each:
  - `"extends": "../tsconfig.base.json"`.
  - Minimal and valid. Because no `src/` exists yet, each config must be arranged so `tsc --noEmit` succeeds cleanly on an empty workspace (see Technical notes for the two acceptable approaches — empty/guarded `include`, or `files: []`). Do NOT add framework-specific `lib`/`types`/`jsx`/`compilerOptions` (Vite, DOM, `@cloudflare/workers-types`, etc.) — those come in Phase 1 / Phase 12 tickets.
- **Biome** as the single formatter + linter at the repo root:
  - Add `@biomejs/biome` as a **root devDependency** (pin an exact recent version).
  - Add **`biome.json`** at the repo root with formatter + linter **enabled**, `organizeImports` **enabled**, and settings consistent with the existing `.editorconfig` (2-space indent, LF line endings, final newline, trailing-whitespace trim). Include a sensible `files.ignore` (e.g. `node_modules`, `dist`, `.wrangler`, `.vite`, `package-lock.json`) and use Biome's recommended rule set.
- **Real root `package.json` scripts** replacing the TICKET-001 placeholders (which explicitly echoed "configured in TICKET-002"):
  - `"format": "biome format --write ."` (and/or a `format:check` variant — implementer's call, but `format` must be usable and deterministic).
  - `"lint": "biome check ."` (Biome `check` = lint + format-verify + import-organize check).
  - `"typecheck": "npm run typecheck --workspaces --if-present"` **OR** a root script that runs `tsc --noEmit -p <each workspace>` — pick the simpler approach that passes with no source (see Technical notes). If delegating, add a `"typecheck": "tsc --noEmit"` script to each workspace `package.json`.
  - Keep `"build"` and `"test"` as `--workspaces --if-present` delegators (no real build/test wired yet).
- Update root `package-lock.json` via `npm install` (the only expected dependency addition is `@biomejs/biome`).

**Out of scope (future tickets — do NOT touch):**
- Installing ANY app framework or runtime lib: Vite, React, Tailwind/shadcn, Tanstack (Router/Query/Form), Hono, Wrangler, Drizzle, better-auth, Zod, tiptap, etc.
- Any `src/` code, `index.ts`, `enums.ts`, or Zod schemas (later Phase 0 steps).
- Framework-specific tsconfig content: `lib: ["DOM"]`, `jsx`, `@cloudflare/workers-types`, Vite `types`, project-reference wiring to app configs (Phase 1 / Phase 12).
- Any tests, Vitest/Playwright config, or CI wiring (Phase 18 for CI; test harness in Phase 1+).
- `wrangler.toml`, `vite.config.ts`, `drizzle.config.ts`, `tailwind.config.ts`.
- `docs/CONTEXT.md` skeleton (separate later Phase 0 step).
- Git init / branching / commit (a known TICKET-001 follow-up handled by devops on `/done`).

## Technical notes (architect)
- **Alignment:** ARCHITECTURE §5 (shared workspace `@app/shared` ships TS source consumed by bundlers directly — **no build step**, so the base config is type-check-only), §8.1 (repo-root tree), §9.6 (testing/tooling live at the root and are shared), and ADR-007 (shared contract as the boundary). NFR-1 (buildable skeleton). This ticket adds only config + one devDependency; it introduces no app frameworks.
- **Single formatter/linter = Biome.** Although the ROADMAP Phase 0 line historically read "ESLint + Prettier", the project tooling decision (recorded in TICKET-001 scope/notes: "Biome will be the formatter/linter, installed & configured in TICKET-002") is **Biome as the single tool** for both formatting and linting. Do NOT install ESLint or Prettier. If `docs/DECISIONS.md`/`ROADMAP.md` need a note reconciling this, that is a `docs-keeper` follow-up on `/done`, not part of this ticket's code.
- **Strict TS is a hard rule (CLAUDE.md).** `strict: true` + `noUncheckedIndexedAccess` are mandatory in `tsconfig.base.json`. The base is `noEmit: true`; per-app emit/bundler options are added by their own tickets.
- **`moduleResolution: "Bundler"`** is correct here because both Vite (FE) and Wrangler/esbuild (BE) bundle, and `@app/shared` is consumed as source — no `.js` extension imports required. This must stay compatible with later Worker and Vite tsconfigs, which will layer their own `lib`/`types` on top.
- **How `typecheck` passes with NO source yet (be explicit):** with empty workspaces, `tsc -p tsconfig.json` can error "No inputs were found". Choose ONE approach and apply it consistently across all three workspaces:
  1. **Guarded include (recommended):** set each workspace tsconfig to `"include": ["src/**/*"]` **plus** `"compilerOptions": { "noEmit": true }`, and pass `--emitDeclarationOnly false`… — but this still errors on zero inputs. Therefore prefer:
  2. **`"files": []` + `"include": ["src/**/*.ts", "src/**/*.tsx"]`** is still empty → errors. The clean, dependable option is: set `"files": []` and OMIT/keep `include` matching `src` so that TypeScript treats "no matched files" as **not an error when `files` is explicitly present**. If the installed TS version still errors on zero inputs, fall back to running `tsc --noEmit` with the `--allowJs`-independent flag combination, OR run typecheck as a **documented no-op** that only becomes real once `src/` exists.
  - **Decision for the implementer:** make `typecheck` **exit 0 on empty workspaces today** and become a real `tsc --noEmit` the moment source files exist — the simplest reliable mechanism given the pinned TS version wins (e.g. `"files": []` with an `include` for `src`, or a tiny placeholder pattern). Document the chosen mechanism in a one-line comment in each tsconfig or in the ticket's Implementation notes. Do NOT add a placeholder `.ts` file just to satisfy tsc (that would leak "src code" into a config-only ticket).
- **Simpler-approach recommendation:** prefer **per-workspace `typecheck` scripts delegated by the root** over root project-references. Project references add wiring (`composite`, reference graphs) with no payoff while workspaces are empty; they can be introduced later if incremental typecheck is needed. Keep it simple: root `typecheck` = `npm run typecheck --workspaces --if-present`, each workspace `typecheck` = `tsc --noEmit`.
- **Biome ↔ .editorconfig parity:** the existing `.editorconfig` (from TICKET-001) sets UTF-8, LF, final newline, trim trailing whitespace, 2-space indent for TS/JS/JSON. `biome.json` `formatter` settings MUST match (`indentStyle: "space"`, `indentWidth: 2`, `lineEnding: "lf"`). Biome is the enforcer; `.editorconfig` stays for editor UX — no conflict.
- **Lockfile:** the only new dependency is `@biomejs/biome` (root devDependency). `npm install` should update `package-lock.json` accordingly and add nothing else.

## Acceptance criteria (ai-ba)
- [ ] **Given** a fresh install, **When** I run `npm install` at the root, **Then** it completes with no errors and adds ONLY `@biomejs/biome` (as a root devDependency) to `package.json` + `package-lock.json`.
- [ ] **Given** Biome is installed, **When** I run `npx biome --version`, **Then** it resolves and prints a version.
- [ ] **Given** the repo, **When** I run `npm run lint` (`biome check .`), **Then** it runs and exits 0 (passes) on the current repo.
- [ ] **Given** the repo, **When** I run `npm run format`, **Then** it runs deterministically (formats or reports already-formatted) and exits 0; running it a second time produces no further changes.
- [ ] **Given** the repo, **When** I run `npm run typecheck`, **Then** it invokes `tsc --noEmit` across the workspaces and exits 0 **even though no source files exist yet** (no "No inputs were found" failure).
- [ ] **Given** `tsconfig.base.json`, **When** I inspect its `compilerOptions`, **Then** `strict` is `true` and it includes `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, and modern module settings (`moduleResolution: "Bundler"`, ESNext target/module), with `noEmit: true`.
- [ ] **Given** each workspace, **When** I inspect `frontend/tsconfig.json`, `backend/tsconfig.json`, and `shared/tsconfig.json`, **Then** each `"extends": "../tsconfig.base.json"` and is minimal (no framework-specific `lib`/`types`/`jsx`).
- [ ] **Given** `biome.json`, **When** I inspect it, **Then** formatter + linter are enabled, `organizeImports` is enabled, and formatter settings match `.editorconfig` (2-space indent, LF line endings).
- [ ] **Given** the root `package.json`, **When** I inspect `scripts`, **Then** the TICKET-001 lint/typecheck placeholders are GONE and replaced with real `lint` (biome check), `format` (biome format), and `typecheck` (tsc across workspaces), while `build`/`test` remain `--workspaces --if-present` delegators.
- [ ] **Given** this ticket's scope, **When** I search the repo, **Then** NO app frameworks are installed (no Vite/React/Hono/Wrangler/Drizzle/Tailwind/Tanstack/better-auth/Zod), NO ESLint/Prettier is installed, and NO `src/` code exists in any workspace.
- [ ] **Given** `shared/`, **When** I inspect it, **Then** it still has NO `src/`, NO `enums.ts`, and NO Zod schemas (those remain deferred to later Phase 0 steps).

## QA notes (ai-qa)
How to verify:
1. From the repo root run `npm install` — expect success; diff `package.json`/`package-lock.json` to confirm the ONLY added dependency is `@biomejs/biome`.
2. Run `npx biome --version` — confirm it resolves and prints a version.
3. Run `npm run lint` — confirm it executes `biome check .` and exits 0. Deliberately introduce a badly-formatted / lint-violating snippet in a scratch file, re-run, and confirm Biome flags it; then remove the scratch file.
4. Run `npm run format` twice — first run may format; the second run MUST report no changes (deterministic/idempotent).
5. Run `npm run typecheck` — confirm it runs `tsc --noEmit` across all three workspaces and exits 0 with NO "No inputs were found in config file" error despite empty workspaces. Note the mechanism used (e.g. `files: []` / guarded include) in the Implementation notes.
6. Open `tsconfig.base.json` and confirm `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `moduleResolution: "Bundler"`, ESNext target/module, `noEmit: true`.
7. Open each workspace `tsconfig.json` and confirm `extends: "../tsconfig.base.json"` and the absence of framework-specific options.
8. Open `biome.json` and confirm formatter + linter enabled, `organizeImports` enabled, `indentStyle: space`, `indentWidth: 2`, `lineEnding: lf`, and a sensible ignore list; cross-check against `.editorconfig`.
9. Open root `package.json` scripts and confirm the placeholder `lint`/`typecheck` from TICKET-001 are replaced with real commands; `build`/`test` remain `--workspaces --if-present`.
10. Search the tree: confirm no ESLint/Prettier config or deps, no app-framework deps, no `src/` files anywhere.
11. Edge cases: delete `node_modules/` + reinstall for reproducibility; confirm `lint`/`format`/`typecheck` still pass on the clean checkout; confirm `git status` (if a repo exists) shows only intended file additions plus the lockfile.

## Implementation notes (filled after implementation)

- **Files touched:**
  - NEW: `tsconfig.base.json`, `frontend/tsconfig.json`, `backend/tsconfig.json`, `shared/tsconfig.json`, `biome.json`.
  - MODIFIED: root `package.json` — real scripts (`format`, `format:check`, `lint`, `typecheck`); `build`/`test` remain `--workspaces --if-present`; added devDeps (`@biomejs/biome`, `typescript`).
  - MODIFIED: `frontend/package.json`, `backend/package.json`, `shared/package.json` — added `"typecheck": "tsc --noEmit"`.
  - REGENERATED: `package-lock.json`.

- **Key decisions:**
  - **Biome 1.9.4** (1.x schema) as the single formatter + linter (`organizeImports` on; formatter matches `.editorconfig`: 2-space indent, LF line endings).
  - **TypeScript 5.9.3** added as a root devDependency — REQUIRED for the `tsc` typecheck scripts (a necessary build tool, not an app framework).
  - **Empty-workspace typecheck mechanism:** each workspace tsconfig uses `"files": []` + `"include": ["src/**/*.ts"]` (`+ "src/**/*.tsx"` for frontend). This exits 0 today on empty workspaces AND activates real `tsc --noEmit` once `src/` appears (QA-proven: a type error → exit 2, then clean).
  - `.claude` and `.agents` added to Biome ignore (vendored harness/skill assets, not project source).

- **Review verdict:** code-reviewer **APPROVE WITH NITS** — no blockers; the `files: []` + `include` finding was empirically confirmed correct; remaining nits are cosmetic only.

- **QA verdict:** **PASSED** — all 11 acceptance criteria PASS with live evidence; adversarial tests passed (Biome flags lint + format violations; typecheck catches a real type error, then returns clean); reproducible from clean `node_modules`.

- **Acceptance-criterion reconciliation:** criterion #1 said "ONLY `@biomejs/biome`" — read as `@biomejs/biome` + `typescript` (both dev/build tools, not app frameworks). No app frameworks, no ESLint/Prettier, no `src/` code added.

- **Follow-ups discovered (→ future tickets):** none blocking. (TS project references intentionally deferred; framework-specific tsconfig `lib`/`types`/`jsx` come in Phase 1 / Phase 12.)
