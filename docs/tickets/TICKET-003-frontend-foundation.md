# TICKET-003 — Frontend foundation: Vite + React + Tailwind + shadcn + theming + router

- **Status:** DONE <!-- CREATED | IN PROGRESS | QA | AWAITING APPROVAL | DONE -->
- **Created:** 2026-07-03
- **Completed:** 2026-07-03
- **Branch:** ticket/003-frontend-foundation
- **PR:** https://github.com/billcastle/quiz-creatorv2/pull/3
- **Area:** frontend
- **Depends on:** TICKET-001 (DONE — monorepo root & npm workspaces), TICKET-002 (DONE — strict TS base config + Biome + root scripts)

## Goal
Stand up the runnable frontend foundation: initialize the `frontend/` workspace as a Vite + React + TypeScript SPA with Tailwind CSS, an initialized shadcn/ui, light + dark theme token files (ADR-010), the Inter base font, and a minimal Tanstack Router app shell that renders an index route. After this ticket the **next** ticket only has to build the `/design-system` page + showcase components — every dependency, alias, style layer, theme mechanism, and router slot it needs is already in place here.

> **PIVOT note:** This ticket previously scoped the *Backend Worker skeleton (Hono + health route + Wrangler)*. Per user decision, TICKET-003 now delivers the **frontend foundation** so design-system work can proceed next; the backend Worker skeleton is **DEFERRED** and will be re-created as its own later ticket via `/next-ticket` (see ROADMAP note). This pulls ARCHITECTURE §7 / ROADMAP Phase 12 base work earlier than the original backend-first order.

## Scope
**In scope:**

- **Vite + React + TypeScript SPA** — initialize the `frontend/` workspace:
  - `dependencies` (pin **exact**, no `^`/`~`, per repo convention): `react`, `react-dom` (React 19.x current stable; implementer may use the latest exact stable at implementation time).
  - `devDependencies` (pin exact): `vite` (v6.x current stable), `@vitejs/plugin-react`, `@types/react`, `@types/react-dom`.
  - `frontend/index.html` (SPA entry with `#root`), `frontend/src/main.tsx` (React root mount), `frontend/vite.config.ts` (React plugin + Tailwind + `@/*` alias — see below).
  - Keep using the repo's **npm workspaces + Biome + `tsconfig.base.json`** — do NOT introduce a second package manager, a second linter, or a per-workspace tsconfig base.

- **`frontend/tsconfig.json`** — upgrade from the TICKET-002 empty-workspace guard to a **real React config**:
  - Keep `"extends": "../tsconfig.base.json"` (do NOT weaken any base strict flags — `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc. stay on).
  - Add `"jsx": "react-jsx"`.
  - Add `"lib": ["ESNext", "DOM", "DOM.Iterable"]`.
  - Add Vite client types: `"types": ["vite/client"]`.
  - Add the path alias: `"baseUrl": "."` + `"paths": { "@/*": ["./src/*"] }` (must match the Vite alias).
  - **Remove the `"files": []` empty-guard** (real source now exists) and keep `"include": ["src/**/*.ts", "src/**/*.tsx"]` so `tsc --noEmit` type-checks the real source.
  - If Vite's generated `tsconfig.node.json` split is used for `vite.config.ts`, that's acceptable — but keep it minimal and extending the base; state the choice in Implementation notes.

- **Tailwind CSS** — set up and wired to the app:
  - **Recommended approach: Tailwind CSS v4 via the `@tailwindcss/vite` plugin** (current approach; simpler than the PostCSS pipeline and the shadcn-supported path for new projects). Pin exact. If the implementer instead chooses Tailwind v3 + `tailwind.config.ts` + `postcss.config.js`, that is acceptable **only if** shadcn/ui init and the ADR-010 token layer still work cleanly — **state which version + mechanism was chosen** in Implementation notes.
  - A base stylesheet (e.g. `frontend/src/index.css`) importing Tailwind and hosting the theme token layer (see Theming). Content globs / source detection configured so classes in `src/**/*.tsx` are picked up.

- **Inter font** — wired as the base font:
  - **Recommended: `@fontsource/inter`** (self-hosted, offline, no CDN dependency — matches the build-time/no-external-runtime posture). Pin exact. Import in `main.tsx`/`index.css` and set Inter as the base `font-family` (via the Tailwind theme/token so components inherit it).
  - If the implementer prefers `@fontsource-variable/inter` or a `<link>` CDN, state the choice; **CDN is discouraged** (offline verification + no external runtime dependency).

- **shadcn/ui initialized** — the setup, NOT the full showcase:
  - Run/produce `components.json` (style, base color, CSS-variables mode = true, alias config).
  - The `cn` util helper (`src/lib/utils.ts` using `clsx` + `tailwind-merge`; pin those exact) and any `class-variance-authority` dep shadcn primitives need.
  - The `@/*` path alias wired in **both** `vite.config.ts` (resolve.alias) **and** `tsconfig.json` (paths) — they MUST agree.
  - The CSS-variable theme layer that shadcn expects (`--background`, `--foreground`, `--primary`, `--radius`, etc.) — reconciled with the ADR-010 token files (see Theming).
  - Install a **SMALL** number of baseline primitives ONLY to prove the setup works end-to-end — **`Button` is sufficient** (add `@radix-ui/*` deps it pulls in). Do NOT add the full primitive set — the component showcase is the NEXT ticket.

- **Theming (ADR-010)** — build-time CSS custom-property token files + runtime switch:
  - Ship **light (default)** and **dark** token files. Structure per ADR-010 so that "add a theme = add a token file + register it in a manifest." Recommended layout: `frontend/src/themes/light.css`, `frontend/src/themes/dark.css` (+ a small `frontend/src/themes/manifest.ts` listing available themes) imported by `index.css`.
  - **Reconcile the shadcn convention with ADR-010:** shadcn ships tokens as `:root { … }` (light) + `.dark { … }` (dark) toggled by a `.dark` class on `<html>`. ARCHITECTURE §7.4 / ADR-010 describe toggling `data-theme`/class on `<html>`. **Recommendation:** adopt shadcn's `.dark` class as the concrete mechanism for the light/dark pair (least friction, works out-of-the-box with shadcn components), and keep the token files structured so additional named themes can be added as `[data-theme="…"]` blocks later. **State the chosen mechanism explicitly** in Implementation notes and note that ADR-010's "`data-theme`/class" language covers both.
  - A **minimal theme mechanism** to apply + persist the active theme MAY be included: either the Zustand `themeStore` (persisted to localStorage) per ARCHITECTURE §7.3, or a tiny theme provider that reads/writes the `.dark` class. Keep it minimal. The **visible theme SWITCHER UI (the toggle in the header) is DEFERRED** to the design-system/header ticket — include only the mechanism here, and say so.

- **Tanstack Router base + minimal app shell:**
  - Install `@tanstack/react-router` (pin exact) + its Vite plugin/generator if the file-based/codegen approach is used (`@tanstack/router-plugin` / `@tanstack/router-vite-plugin` as appropriate) — implementer picks file-based (with generated `routeTree.gen.ts`) or code-based router; **state which** in Implementation notes.
  - Set up the router with a **root route** (`__root`) and a **minimal index route** (`/`).
  - A **minimal `AppLayout` shell** just sufficient to host routes (a header/sidebar may be **stubs or omitted** — the full collapsible sidebar + header live in a later ticket per ARCHITECTURE §7.2). Render an `<Outlet/>` so the index route displays.
  - Ensure the app **builds and renders** the index route through the shell.
  - Leave a clear, documented **slot/comment for where `/design-system` will be added** next (a `routes/` folder location or a comment in `router.tsx`).

- **Frontend `package.json` scripts:**
  - `"dev": "vite"`, `"build": "vite build"` (ensure it type-checks / is compatible with `tsc` — either `"build": "tsc -b && vite build"` or rely on the existing root `typecheck`; state the choice), `"preview": "vite preview"`.
  - Keep the existing `"typecheck": "tsc --noEmit"` (now checks real React source).
  - Ensure **root** `npm run typecheck` / `npm run lint` / `npm run format` / `npm run build` all still work with the new frontend source (root `build` is a `--workspaces --if-present` delegator, so `frontend build` now runs).

- **Testing (RECOMMENDED — include a minimal harness):** add **Vitest + React Testing Library** with **ONE smoke test** that renders the app shell / index route and asserts it mounts. Add `vitest`, `@testing-library/react`, `@testing-library/dom`, `jsdom` (or `happy-dom`) as exact-pinned devDeps, a minimal `vitest.config.ts` (or Vite `test` block) with `environment: "jsdom"`, and a `"test": "vitest run"` script. See Technical notes for the recommendation + the deferral fallback.

- **Biome:** ensure `biome check .` passes on the new TSX. Add any necessary ignores for **generated files** — notably Tanstack Router's `routeTree.gen.ts` and shadcn-generated files if their style conflicts — to `biome.json`'s ignore list so lint/format stay green without hand-editing generated output.

**Out of scope (future tickets — do NOT build here):**
- The actual **`/design-system` PAGE** and the full component showcase (the NEXT ticket — this ticket only prepares for it).
- The **full sidebar + header** with the visible **theme switcher UI** and account menu (later FE-shell ticket — ARCHITECTURE §7.2; only the theme *mechanism* lands here).
- **Auth pages** (`/auth/sign-in`, `/auth/sign-up`) and any auth UI.
- **Any backend / Worker / Hono / D1 / R2 / better-auth** work (the deferred backend skeleton and all later backend phases).
- **Real API calls** / Tanstack **Query** wiring to endpoints: the Query provider MAY be set up (optional, minimal) but there must be **no real queries** and no `lib/api.ts` fetch wiring to a live endpoint (that arrives with the API-client ticket).
- **All other app pages** (explore, builder, answering, profiles, settings, blog, admin, etc.).
- **`@app/shared` consumption** — ADR-007's shared package is NOT imported yet (no shared schemas exist to use).
- **Deployment / CI / Cloudflare Pages config**, `.env`/Pages env wiring, E2E/Playwright.

## Technical notes (architect)
- **Alignment:** ARCHITECTURE §7.1 (Tanstack Router tree — this ticket lands the root + index only; the full tree + layout groups come later), §7.2 (AppLayout/BareLayout + sidebar — only a minimal shell here), §7.3 (Zustand for theme/UI state; Tanstack Query for server state — Query optional/minimal, no real queries), §7.4 (Tailwind + shadcn, Inter base font, CSS-custom-property theming), §8.2 (frontend folder tree — `main.tsx`, `router.tsx`, `routes/`, `components/ui/`, `lib/`, `themes/`, `stores/`). ADR-010 (theming). ADR-007 (shared package NOT consumed yet). ROADMAP Phase 12 (this is that phase's base work, pulled earlier by the pivot).
- **Version pins:** every added dep/devDep pinned **exact** (no `^`/`~`) to match TICKET-001/002 convention. React 19.x + Vite 6.x are the current stable line; use the latest exact stable available at implementation time and record the exact versions in Implementation notes.
- **Tailwind version approach:** recommend **Tailwind v4 + `@tailwindcss/vite`** (no `tailwind.config.ts`/PostCSS needed; shadcn supports it) for the simplest reliable setup. If v3 is chosen, add `tailwind.config.ts` + `postcss.config.js` and ensure shadcn init + token layer still resolve. **The chosen version + mechanism MUST be recorded.**
- **shadcn ↔ ADR-010 reconciliation:** shadcn's token contract (`:root` / `.dark`, CSS variables, `--radius`, `hsl(var(--…))` colors) IS the ADR-010 "CSS custom-property token files" mechanism in practice. Keep the light/dark pair as shadcn expects (`.dark` class toggle) and structure the `themes/` files so future named themes are additive token blocks — this satisfies ADR-010's "add a token file to add a theme" without fighting shadcn. Do NOT invent a parallel token system.
- **`@/*` alias in BOTH places:** the alias must be declared in `vite.config.ts` (`resolve.alias` — e.g. `"@": path.resolve(__dirname, "./src")`) AND `tsconfig.json` (`baseUrl` + `paths`). If they disagree, either the build or the type-check breaks. shadcn's `components.json` aliases must point at the same `@/*`.
- **Root typecheck/lint/build must stay green:** `frontend/tsconfig.json` now type-checks real strict React source — expect to satisfy `verbatimModuleSyntax` (use `import type` for type-only imports), `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` in the new code. `biome check .` must pass on TSX; generated files (`routeTree.gen.ts`) go in Biome's ignore list rather than being hand-formatted.
- **Generated router file + Biome:** if the file-based router/codegen is used, `routeTree.gen.ts` is auto-generated and will fight the formatter — add it to `biome.json` `files.ignore` (and ensure it is not treated as hand-authored source; it can still be type-checked). If a **code-based** router is used instead, there is no generated file — simpler for a single index route; **either is acceptable**, state the choice.
- **Test-harness recommendation (Vitest + RTL, INCLUDE it):** CLAUDE.md says add tests "where the stack allows," and a Vite SPA supports Vitest + RTL trivially. **Recommendation: include a minimal Vitest + RTL harness with ONE smoke test** (renders the app shell / index route → asserts it mounts) — it is low-cost, proves the render path, and seeds the FE test story for later component tickets. **Fallback:** if wiring the harness meaningfully bloats this already-broad ticket (e.g. jsdom/router-test friction consumes the session), DEFER it to an immediate fast-follow ticket and **say so explicitly with rationale** — but the default is to include it.
- **Simplicity guardrails (CLAUDE.md):** keep the shell minimal — one index route, one `Button`, light+dark tokens, theme mechanism (no switcher UI), one smoke test. Do NOT pre-create empty `routes/` for every future page, do NOT add Query hooks, do NOT scaffold the sidebar/header, do NOT import `@app/shared`. Empty scaffolding folders add drift — they arrive with their tickets.
- **Risks to watch (flag in Implementation notes):**
  1. **Breadth in one session** — the user explicitly accepted the larger scope; keep each piece minimal to fit one focused `/implement`. If it overruns, the smallest safe split is: land Vite+React+Tailwind+shadcn+Inter+router shell in this ticket and fast-follow the theming token files OR the Vitest harness — but attempt the full foundation first.
  2. **Generated `routeTree.gen.ts` vs Biome** — must be ignored, not hand-edited.
  3. **Strict-mode TS with React** — `verbatimModuleSyntax` + `exactOptionalPropertyTypes` can surface friction in React/router/shadcn code; resolve with `import type` and correct optional handling, NOT by weakening base flags.
  4. **Tailwind v4 vs v3 with shadcn** — pick the version shadcn's current init supports cleanly; verify the token layer renders before calling it done.

## Acceptance criteria (ai-ba)
- [ ] **Given** the frontend workspace, **When** I inspect `frontend/package.json`, **Then** `react` + `react-dom` are pinned-exact `dependencies` and `vite`, `@vitejs/plugin-react`, `@types/react`, `@types/react-dom` (plus Tailwind, shadcn util deps, Tanstack Router, Inter font, and — if included — Vitest/RTL) are pinned-exact `devDependencies` (no `^`/`~`).
- [ ] **Given** the frontend workspace, **When** I run `npm --workspace @app/frontend run dev` (or `npx vite` in `frontend/`), **Then** the Vite dev server starts without error and serves the SPA.
- [ ] **Given** the frontend workspace, **When** I run `npm --workspace @app/frontend run build` (and/or root `npm run build`), **Then** `vite build` produces a production build (a `dist/`) with no type or build errors.
- [ ] **Given** the repo root, **When** I run `npm run typecheck`, **Then** it exits 0 — the frontend now type-checks real strict React `src/**/*.tsx` against DOM libs with no errors and no weakened base flags.
- [ ] **Given** the repo root, **When** I run `npm run lint` (`biome check .`), **Then** it exits 0 on the new TSX, and any generated file (e.g. `routeTree.gen.ts`) is handled via Biome's ignore list rather than causing failures.
- [ ] **Given** `frontend/tsconfig.json`, **When** I inspect it, **Then** it still `extends "../tsconfig.base.json"`, adds `jsx: "react-jsx"`, `lib: ["ESNext","DOM","DOM.Iterable"]`, `types: ["vite/client"]`, `baseUrl` + `paths` for `@/*`, has the `files: []` guard removed, keeps `include` for `src`, and weakens NO base strict flag.
- [ ] **Given** shadcn/ui, **When** I inspect the project, **Then** `components.json` exists (CSS-variables mode), `src/lib/utils.ts` exports `cn`, and the `@/*` alias resolves identically in `vite.config.ts` and `tsconfig.json`; at least the `Button` primitive is present and importable via `@/components/ui/button`.
- [ ] **Given** the running app, **When** I use a Tailwind utility class on an element, **Then** the style is applied (Tailwind is active), and the base font resolves to **Inter** (self-hosted via `@fontsource*`, no CDN).
- [ ] **Given** theming, **When** I inspect `src/themes/`, **Then** light (default) + dark token files exist with the ADR-010 structure (add-a-theme = add-a-file), and toggling the active theme (`.dark` class or `data-theme` per the chosen/stated mechanism) on `<html>` **visibly changes the token-driven colors**; the theme mechanism persists/applies the choice, and NO visible switcher UI is included (deferred).
- [ ] **Given** Tanstack Router, **When** the app loads `/`, **Then** the **index route renders through the minimal `AppLayout` shell** (root route + `<Outlet/>`), and there is a documented slot/comment for the future `/design-system` route.
- [ ] **(If included) Given** the Vitest + RTL harness, **When** I run `npm --workspace @app/frontend run test` (`vitest run`), **Then** the single smoke test (renders the app shell / index route) passes. **(If deferred)** the deferral + rationale is recorded in Implementation notes and a fast-follow ticket is noted.
- [ ] **Given** this ticket's scope, **When** I inspect the tree, **Then** scope guards hold: **no `/design-system` page**, **no full sidebar/header or theme-switcher UI**, **no auth pages**, **no backend/Worker files**, **no real Tanstack Query queries / `lib/api.ts` endpoint wiring**, and **no `@app/shared` import**; only `frontend/` changed (plus root `package-lock.json`, and `biome.json` if an ignore was added).

## QA notes (ai-qa)
How to verify (offline — Vite + Vitest only, **no Cloudflare account/deploy needed**):
1. From the repo root run `npm install` — expect success; diff `package.json`/`package-lock.json` and confirm the added packages are the FE stack only (react/react-dom; vite/@vitejs/plugin-react/@types/*; Tailwind; shadcn util deps: clsx, tailwind-merge, class-variance-authority, @radix-ui/* for Button; @tanstack/react-router [+ plugin]; @fontsource(-variable)/inter; and — if included — vitest, @testing-library/react, @testing-library/dom, jsdom). Confirm **no** backend deps (hono/wrangler/@cloudflare/*), **no** drizzle/better-auth/zod, **no** `@app/shared` dependency.
2. Run `npm run typecheck` at the root — confirm exit 0 and that the frontend compiles real `src/**/*.tsx`. Adversarial: introduce a type error in `main.tsx` (e.g. pass a `number` where a `string` is expected), re-run, confirm exit ≠ 0, then revert — proves it type-checks real strict React source (not a no-op guard).
3. Run `npm run lint` at the root — confirm `biome check .` exits 0 on the new TSX. Confirm `routeTree.gen.ts` (if present) is in Biome's ignore list (open `biome.json`) and not the reason lint passes/fails by hand.
4. Run `npm --workspace @app/frontend run dev` — confirm Vite starts; open the served URL and confirm the index route renders through the shell. Toggle the theme mechanism (add/remove `.dark` on `<html>` in devtools, or via the included mechanism) and confirm token-driven colors change (light↔dark).
5. Run `npm --workspace @app/frontend run build` (and root `npm run build`) — confirm a `dist/` is produced with no errors. Optionally `npm --workspace @app/frontend run preview` and load the built app.
6. Confirm Tailwind + Inter: inspect a Tailwind-classed element (style applied) and computed `font-family` (Inter). Confirm `Button` from `@/components/ui/button` renders.
7. **(If included)** Run `npm --workspace @app/frontend run test` (`vitest run`) — confirm the smoke test passes. Adversarial: break the render (e.g. throw in the index component), confirm the test fails, then revert.
8. Open `frontend/tsconfig.json` — confirm `extends`, `jsx: react-jsx`, `lib` DOM entries, `vite/client` types, `@/*` paths, `files: []` removed, `include` for src, no base strict flag overridden.
9. Open `vite.config.ts` + `components.json` — confirm the `@/*` alias agrees across Vite, tsconfig, and shadcn config.
10. Scope guards: confirm NO `/design-system` page, NO sidebar/header/theme-switcher UI, NO auth pages, NO backend/Worker files, NO real Query hooks / `lib/api.ts` endpoint wiring, NO `@app/shared` import.
11. Edge cases: delete `node_modules/` + reinstall on a clean checkout; re-run `typecheck`/`lint`/`build`/`test`; confirm `git status` shows only intended `frontend/` additions plus the lockfile (and `biome.json` if edited).

## Implementation notes (filled after implementation)
- Files touched:
  - **Created:** `frontend/index.html`, `frontend/vite.config.ts`, `frontend/vitest.config.ts`, `frontend/components.json`, `frontend/src/main.tsx`, `frontend/src/index.css`, `frontend/src/lib/utils.ts`, `frontend/src/lib/theme.ts`, `frontend/src/components/ui/button.tsx`, `frontend/src/components/layout/AppLayout.tsx`, `frontend/src/routes/__root.tsx`, `frontend/src/routes/index.tsx`, `frontend/src/themes/light.css`, `frontend/src/themes/dark.css`, `frontend/src/themes/manifest.ts`, `frontend/src/test/setup.ts`, `frontend/src/test/app.test.tsx`.
  - **Modified:** `frontend/package.json` (deps + scripts), `frontend/tsconfig.json` (real React config), `biome.json` (ignore `**/routeTree.gen.ts`), `.gitignore` (ignore `routeTree.gen.ts`), removed `frontend/.gitkeep`.
  - **Generated (git-ignored, not hand-authored):** `frontend/src/routeTree.gen.ts` (Tanstack Router codegen).
- React / Vite exact versions: **React 19.2.7 + react-dom 19.2.7; Vite 8.1.3** (`@vitejs/plugin-react` 6.0.3, `@types/react` 19.2.17, `@types/react-dom` 19.2.3, `@types/node` 22.20.0). **Deviation from ticket "Vite 6.x":** the ticket allowed "latest exact stable at implementation time" — the current stable line is Vite 8, and plugin-react 6 requires Vite ^8. Used Vite 8 accordingly.
- Tailwind version + mechanism: **Tailwind CSS v4 (4.3.2) via `@tailwindcss/vite`** (recommended path). No `tailwind.config.ts`/PostCSS. Tokens mapped to Tailwind utilities via `@theme inline` in `src/index.css`; dark variant enabled with `@custom-variant dark (&:where(.dark, .dark *))`.
- Inter font choice: **`@fontsource/inter` 5.2.8** (self-hosted, no CDN). Weights 400/500/600/700 imported in `src/index.css`; wired as base `--font-sans` and applied to `body`. Fonts are bundled into `dist/assets/` (verified in build output).
- Theme mechanism: **shadcn `.dark` class toggle on `<html>`** (chosen concrete mechanism). Reconciled with ADR-010: light tokens in `:root` (`themes/light.css`), dark in `.dark` (`themes/dark.css`), `themes/manifest.ts` registers themes; future named themes attach as `[data-theme="..."]` blocks. Minimal apply/persist logic in `src/lib/theme.ts` (localStorage key `qc-theme`, `initTheme()` called in `main.tsx`). **No switcher UI** (deferred per scope).
- Router style: **File-based routing with generated `routeTree.gen.ts`** via `@tanstack/router-plugin` 1.168.19 + `@tanstack/react-router` 1.170.17. `__root.tsx` renders the minimal `AppLayout` shell (`<Outlet/>`); `index.tsx` is the `/` route. Documented slot for the next `/design-system` route is in `__root.tsx`.
- Test harness: **Included.** Vitest 4.1.9 + `@testing-library/react` 16.3.2 + `@testing-library/dom` 10.4.1 + `@testing-library/jest-dom` 6.9.1 + jsdom 29.1.1. `vitest.config.ts` (jsdom env, mirrors router codegen + `@/*` alias), `src/test/setup.ts`, and one smoke test (`src/test/app.test.tsx`) that renders the index route via a memory-history router and asserts the heading mounts. Passes.
- Biome ignore additions: added `**/routeTree.gen.ts` to `biome.json` `files.ignore`. (`dist` was already ignored.)
- `build` script choice: **vite-only (`vite build`)**. Rationale: root `npm run typecheck` (`tsc --noEmit`) already type-checks strict React source in CI/local flow; keeping `build` as `vite build` avoids double-compilation and the base config's `noEmit: true` conflicting with `tsc -b` project references. Scripts: `dev`, `build`, `preview`, `typecheck`, `test`.
- Alias agreement: `@/*` declared identically in `vite.config.ts` (`resolve.alias`), `vitest.config.ts`, `tsconfig.json` (`baseUrl`+`paths`), and `components.json` aliases.
- tsconfig note: single `frontend/tsconfig.json` (no separate `tsconfig.node.json` — a composite reference conflicted with the base `noEmit: true`, TS6310). Added `"node"` to `types` and included `vite.config.ts`/`vitest.config.ts` so config files are type-checked too. No base strict flag weakened.
- Verification (all from repo root, exit 0): `npm install` (added 191 pkgs, 0 vuln), `npm run typecheck`, `npm run lint`, `npm run build` (produces `frontend/dist`), `npm --workspace @app/frontend run test` (1/1 smoke passes), dev server binds (Vite 8, HTTP 200 on `/`). Adversarial typecheck (invalid router option) correctly exited 2, then reverted to 0.
- Review verdict: **code-reviewer APPROVE WITH NITS** — no critical/major findings. Nits/observations to carry forward: (1) anti-FOUC inline theme script not present — add it when the theme switcher lands (avoids a light→dark flash on first paint); (2) the universal `border-color` rule in `index.css` is broad — watch for unintended borders as components grow; (3) Tailwind v4 `@custom-variant`/`@theme` ordering is fragility-prone — keep the ordering stable when editing `index.css`; (4) `@fontsource/inter` bundles extra subsets/woff — minor asset bloat, revisit if trimming the bundle matters; (5) `localStorage` access in `theme.ts` is SPA-only — guard it if SSR is ever added.
- QA verdict: **PASSED** — all 12 acceptance criteria PASS. 3 adversarial tests confirmed the checks are real: typecheck catches an injected type error, Biome catches a format violation, and Vitest catches a broken render. Reproducible from a clean install; working tree byte-identical after the QA pass.
- Follow-ups discovered (→ future tickets): (a) **backend Worker skeleton re-creation** — deferred by the pivot; re-create via `/next-ticket` later; (b) **`/design-system` page + component showcase** — the next ticket (the reason for this pivot); (c) carry the review nits into the design-system/header ticket: add the anti-FOUC inline theme script (with the switcher), watch the universal `border-color` rule, and keep the Tailwind v4 `@custom-variant`/`@theme` ordering stable.
