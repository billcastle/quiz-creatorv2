# TICKET-004 — Design System page: /design-system route + token & component showcase

- **Status:** DONE <!-- CREATED | IN PROGRESS | QA | AWAITING APPROVAL | DONE -->
- **Created:** 2026-07-03
- **Completed:** 2026-07-03
- **PR:** https://github.com/billcastle/quiz-creatorv2/pull/4
- **Branch:** ticket/004-design-system-page
- **Area:** frontend
- **Depends on:** TICKET-003 (DONE — frontend foundation: Vite 8 + React 19, Tailwind v4 via `@tailwindcss/vite`, shadcn initialized [components.json, `cn`, Button, `@/*` alias], Inter font, light/dark token files + `.dark` toggle in `lib/theme.ts` [no switcher UI], Tanstack Router file-based with `__root` + `index` + minimal `AppLayout` shell and a documented `/design-system` slot, Vitest + RTL harness)

## Goal
Build the `/design-system` route (ARCHITECTURE §7.1 / §7.4: "component/token gallery — dev/design aid") that visually documents the design system: theme **color tokens** as swatches, the **Inter typography** scale, and a **first batch of shadcn/ui components** with their variants and short usage guidance — all rendered through the existing `AppLayout` shell. This gives the team a single visual-QA surface to verify tokens and components across light/dark before the real app pages (builder, answering, explore) are built on top of them, and lands the shadcn primitives those pages will reuse.

## Scope

**In scope:**

- **`/design-system` route (file-based).** Add the route in the slot TICKET-003 left (a `frontend/src/routes/design-system.tsx` file-based route registered via the router codegen; the generated `routeTree.gen.ts` regenerates — stays git-ignored + Biome-ignored per TICKET-003). It renders through the existing `AppLayout` shell via the root `<Outlet/>`. No new layout group is introduced (the `_app`/`_bare` split is a later FE-shell ticket).

- **Page structure.** A single page composed of clearly separated sections, each with a heading and short intro copy. Keep the page itself lean — extract only the small presentational helpers it needs (see below); do not build a generic docs framework.

- **Section 1 — Colors.** Visualize the ADR-010 theme tokens as labeled swatches so it is obvious they are theme-driven. Show the core shadcn/ADR-010 token pairs: `background`/`foreground`, `card`/`card-foreground`, `popover`/`popover-foreground`, `primary`/`primary-foreground`, `secondary`/`secondary-foreground`, `muted`/`muted-foreground`, `accent`/`accent-foreground`, `destructive`/`destructive-foreground`, plus `border`, `input`, `ring`. Each swatch shows the token name and renders using the token (via the Tailwind token utilities, e.g. `bg-primary text-primary-foreground`, or `var(--…)`), so switching theme visibly recolors every swatch. Drive the swatch list from a small data array (token name → utility/var) — do not hand-write 20 near-identical blocks.

- **Section 2 — Typography.** Show the Inter type scale with usage notes: the heading levels (h1–h4 or the Tailwind text-size steps the app will use), body/paragraph, small/muted, and any weight demonstrations (400/500/600/700 already bundled by TICKET-003). Each entry shows the rendered sample plus a short note ("Page title", "Body copy", "Caption / helper text", etc.). Confirm the computed font-family is Inter.

- **Section 3 — Components.** Showcase the **in-scope shadcn primitives** (see next bullet) grouped by component, each showing its variants/sizes/states and a one-line usage note. Since only `Button` exists today, this ticket ADDS the batch below under `frontend/src/components/ui/` and demonstrates each. Include realistic small examples (e.g. a labeled `Input` with its `Label`, a `Select` with a few options, a `RadioGroup`, a `Checkbox`, a `Switch`, a `Card` with header/content, `Tabs`, a `Badge` per variant, a `Separator`).

- **shadcn primitives to ADD now (recommended FIRST batch — form + layout foundations that map directly to upcoming SPEC needs):**
  - `Button` (already present — showcase all variants + sizes)
  - `Input` — text fields (auth, settings, builder titles)
  - `Label` — form field labels (a11y association)
  - `Textarea` — multi-line (descriptions, long-answer)
  - `Select` — dropdowns (category filter FR-31, question type)
  - `Checkbox` — multi-select answers, boolean flags
  - `RadioGroup` — single-select answers, behavior toggles
  - `Switch` — behavior flags (one-at-a-time, paginated, fixed-answer FR-14/15/16)
  - `Card` — the primary content container across pages
  - `Tabs` — sectioned UIs (builder, settings)
  - `Badge` — status/labels (Draft/Published, Quiz/Survey/Scale)
  - `Separator` — visual dividers

- **DEFERRED shadcn primitives (recommend a fast-follow "design-system batch 2" ticket, NOT this ticket):** `Dialog`, `Tooltip`, `DropdownMenu`, `Popover`, `Sheet`, `Toast`/`Sonner`, `Slider`, `Progress` (the quiz progress bar, FR-19), `Tabs`-adjacent `Accordion`, `Avatar`, `Command`, `Table`, `Skeleton`. Rationale below (Technical notes) — these carry extra overlay/portal/state complexity or belong with the feature that needs them, and adding all of them would bloat this session. The showcase page must be structured so batch-2 components slot into the Components section without rework.

- **Theme demo (in-page toggle) — RECOMMENDED, IN SCOPE.** Add a **small in-page theme toggle** on the design-system page (a `Switch` or `Button` that calls the existing `lib/theme.ts` `.dark`-class mechanism and persists via the existing `qc-theme` localStorage key). Its sole purpose is to demonstrate that tokens/components are theme-driven directly on this gallery. **The persistent HEADER theme switcher + custom-theme dropdown (FR-39) remains DEFERRED to the FE-shell/header ticket** — this in-page toggle is a demo control, not the product's header switcher. State this clearly in Implementation notes.

- **Anti-FOUC inline theme script (TICKET-003 review nit #1).** Now that real theme-switching UI appears, add the small inline `<script>` in `frontend/index.html` `<head>` (before the app bundle) that reads the persisted `qc-theme` value from localStorage and applies the `.dark` class to `<html>` **pre-paint**, preventing a light→dark flash on first load. Keep it tiny, dependency-free, and consistent with the `lib/theme.ts` key/mechanism.

- **Carry-forward TICKET-003 review nits (verify, don't over-engineer):**
  - **Universal `border-color` rule (nit #2):** as the swatch/component grid grows, verify the broad `border-color` rule in `index.css` doesn't paint unintended borders; if it does, scope it — do not silently rewrite unrelated CSS.
  - **Tailwind v4 `@custom-variant` / `@theme` ordering (nit #3):** if `index.css` is touched (e.g. to expose a token utility for swatches), keep the existing `@custom-variant dark` / `@theme inline` ordering stable.

- **Tests (Vitest + RTL).** Add at least one test that renders the `/design-system` route (via the memory-history router pattern established in TICKET-003's smoke test) and asserts its main sections mount — e.g. the "Colors", "Typography", and "Components" section headings are present, and at least one representative added primitive (e.g. an `Input` and a `Button`) renders. Optionally assert the in-page theme toggle flips the `.dark` class on the document element.

- **Green bar.** Root `npm run typecheck`, `npm run lint` (`biome check .`), `npm run build`, and `npm --workspace @app/frontend run test` must all stay green. All newly added `components/ui/*` files must pass **strict TS** (no weakened base flags; use `import type`, satisfy `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes`) and **Biome**.

**Out of scope (future tickets — do NOT build here):**
- The **full header/sidebar shell** and the **persistent header theme switcher + custom-theme dropdown (FR-39)** — separate FE-shell/header ticket (ARCHITECTURE §7.2). Only the in-page demo toggle lands here.
- The **`_app` / `_bare` layout-route split** (ARCHITECTURE §7.2) — later.
- **Auth pages** (`/auth/sign-in`, `/auth/sign-up`) and any auth UI.
- **Any backend / Worker / Hono / D1 / R2 / better-auth** work; **no API calls**, **no Tanstack Query** wiring, **no `lib/api.ts`**.
- **All other app pages** (explore, builder, answering, profile, settings, blog, admin, scale) — this page only SHOWCASES components; it does NOT build the quiz builder, forms wiring, or answering flow.
- The **DEFERRED shadcn primitives** listed above (Dialog, Tooltip, DropdownMenu, Popover, Sheet, Toast, Slider, Progress, etc.) — fast-follow "design-system batch 2" ticket.
- **`@app/shared`** consumption / Zod schemas (no shared contracts exist yet).
- New **custom (non-shadcn) app components** (e.g. the tiptap editor, builder pieces) — they arrive with their features.
- **Deployment / CI / Pages** config.

## Technical notes (architect)
- **Alignment:** ARCHITECTURE §7.1 (`/design-system` route in the tree — "dev/design aid"), §7.4 ("Design system route renders the token palette + component gallery across themes for visual QA"; shadcn/ui + Tailwind + Inter; ADR-010 token theming). SPEC FR-37/38/40 (token themes, light default + dark, Inter). ADR-010 (build-time CSS custom-property token files + runtime `.dark`/`data-theme` switch). Builds directly on TICKET-003's foundation — reuse its `cn` util, `@/*` alias, token files (`themes/light.css` / `themes/dark.css`), `lib/theme.ts` mechanism, and the memory-router test pattern. Do NOT re-scaffold anything TICKET-003 already delivered.
- **Adding shadcn primitives under strict TS + Biome:** prefer the shadcn CLI (`npx shadcn@latest add input label textarea select checkbox radio-group switch card tabs badge separator`) so components land in `components/ui/*` using the project's `components.json` (CSS-variables mode, `@/*` alias) — matching how `Button` was added. If the CLI's generated output trips **strict flags** or **Biome**, fix in-file (add `import type` for type-only imports, satisfy `exactOptionalPropertyTypes` / `noUncheckedIndexedAccess`, run `biome format`) rather than weakening base config or adding blanket ignores. Manual authoring (copy from shadcn docs) is an acceptable fallback for any primitive the CLI mishandles under Tailwind v4 — **state per-primitive which path was used** if it deviates. Each Radix-backed primitive pulls exact-pinned `@radix-ui/react-*` deps — pin them **exact** (no `^`/`~`) per repo convention.
- **Radix peer/version sanity (Tailwind v4 + React 19):** verify the shadcn components + their `@radix-ui/*` deps resolve cleanly against React 19 and Tailwind v4 (the same stack TICKET-003 validated). If a specific primitive has React-19 peer friction, note it and prefer the current shadcn-recommended version.
- **Token showcase approach:** drive the color swatches from a small typed array of `{ name, className }` (or `{ name, cssVar }`) and `.map()` them — this keeps the section DRY and makes it trivial to add tokens later. Render each swatch with the actual token utility so theme switching recolors them live (proves they are token-driven, not hard-coded). Do NOT introduce a runtime "read all CSS custom properties" reflection mechanism — an explicit curated list matching ADR-010's tokens is simpler and intentional.
- **Typography showcase:** use the Tailwind text-size utilities + Inter weights already wired in TICKET-003; annotate each with its intended role. No new font work (Inter 400/500/600/700 already bundled).
- **In-page theme toggle vs header switcher:** the toggle here is a **demo control** wired to the existing `lib/theme.ts` (`.dark` class + `qc-theme` localStorage). Do NOT build the FR-39 header switcher or a Zustand `themeStore` here — the persistent switcher and custom-theme dropdown are the FE-shell ticket's job. Keeping the demo toggle local avoids pre-committing the header design.
- **Anti-FOUC script:** inline, dependency-free, in `index.html` `<head>` before the module script; read the same `qc-theme` key `lib/theme.ts` uses and apply `.dark` synchronously. Guard `localStorage` access (try/catch) since the script runs before the app. This directly resolves TICKET-003 review nit #1 (now warranted because switching UI exists).
- **Router:** file-based route added in the TICKET-003 slot; `routeTree.gen.ts` regenerates and stays git-ignored + Biome-ignored (already configured). No changes to `__root`/`AppLayout` beyond what's needed to surface a link/entry to the page (a simple link in the shell is fine but OPTIONAL — direct navigation to `/design-system` must work regardless).
- **Simplicity guardrails (CLAUDE.md):** showcase page only — no docs framework, no per-component MDX, no generic "component playground" with live prop editing, no runtime theme reflection. First batch of primitives only; defer overlay/portal-heavy ones. Every changed line should trace to "show tokens + typography + this batch of components across themes."
- **Risks to watch (flag in Implementation notes):**
  1. **Breadth of the component batch** — 11 new primitives is the bulk of the work; if the session overruns, the smallest safe split is to land Colors + Typography + Button/Input/Label/Textarea/Card + the theme toggle + FOUC script + test in THIS ticket, and fast-follow the remaining form controls (Select/Checkbox/RadioGroup/Switch/Tabs/Badge/Separator) — attempt the full first batch first, and record any deferral with rationale.
  2. **shadcn CLI under Tailwind v4 / React 19** — generated output may need small strict-TS/Biome fixups; fix in-file, don't weaken config.
  3. **`routeTree.gen.ts` regeneration** — ensure it regenerates and remains ignored; don't hand-edit it.
  4. **FOUC script / `theme.ts` drift** — the inline script and `lib/theme.ts` must agree on the localStorage key and the `.dark` mechanism; keep them in sync.
  5. **Universal `border-color` rule** — watch for unintended borders as the grid grows (nit #2); scope only if it actually misbehaves.

## Acceptance criteria (ai-ba)
- [ ] **Given** the frontend router, **When** I navigate to `/design-system` in the running app, **Then** the page renders through the existing `AppLayout` shell (via the root `<Outlet/>`) with no console errors, and the route is a file-based route registered through the codegen (`routeTree.gen.ts` regenerated, still git-ignored + Biome-ignored).
- [ ] **Given** the Colors section, **When** I view it, **Then** labeled swatches for the ADR-010/shadcn core tokens (`background`/`foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive` [each with its `-foreground`], `border`, `input`, `ring`) are shown, each rendered using its token, and the swatch list is data-driven (a mapped array, not 20 hand-written blocks).
- [ ] **Given** the Typography section, **When** I view it, **Then** the Inter scale is shown (heading levels, body, small/muted, weight samples) each with a short usage note, and the computed `font-family` resolves to **Inter**.
- [ ] **Given** the Components section, **When** I view it, **Then** the first-batch primitives — **Button, Input, Label, Textarea, Select, Checkbox, RadioGroup, Switch, Card, Tabs, Badge, Separator** — are each showcased with their variants/sizes/states and a one-line usage note, and each new primitive exists under `frontend/src/components/ui/` and is importable via `@/components/ui/*`.
- [ ] **Given** each newly added `@radix-ui/react-*` dependency, **When** I inspect `frontend/package.json`, **Then** it is pinned **exact** (no `^`/`~`) per repo convention.
- [ ] **Given** the in-page theme toggle, **When** I click it, **Then** the `.dark` class on `<html>` toggles via the existing `lib/theme.ts` mechanism, the choice persists in the `qc-theme` localStorage key, and the token-driven swatches + components **visibly recolor** (light ↔ dark).
- [ ] **Given** `frontend/index.html`, **When** I inspect it, **Then** a small dependency-free inline `<script>` in `<head>` reads the persisted `qc-theme` value and applies the `.dark` class pre-paint (anti-FOUC), guarded against `localStorage` errors, consistent with `lib/theme.ts`.
- [ ] **Given** the repo root, **When** I run `npm run typecheck`, `npm run lint`, and `npm run build`, **Then** each exits 0 — the new `components/ui/*` and route pass strict TS with no weakened base flags and pass Biome, and `vite build` produces a `dist/` with no errors.
- [ ] **Given** the Vitest + RTL harness, **When** I run `npm --workspace @app/frontend run test`, **Then** a test renders the `/design-system` route and asserts the "Colors", "Typography", and "Components" section headings mount and at least one added primitive (e.g. `Input` + `Button`) renders; it passes.
- [ ] **Given** this ticket's scope, **When** I inspect the tree, **Then** scope guards hold: **no header/sidebar shell or FR-39 header theme switcher/custom-theme dropdown**, **no `_app`/`_bare` layout split**, **no auth pages**, **no backend/Worker files**, **no Tanstack Query / `lib/api.ts` wiring**, **no `@app/shared` import**, **no DEFERRED primitives** (Dialog/Tooltip/DropdownMenu/Popover/Sheet/Toast/Slider/Progress/etc.); only `frontend/` changed (plus root `package-lock.json`).

## QA notes (ai-qa)
How to verify (offline — Vite + Vitest only, no Cloudflare account/deploy needed):
1. From the repo root run `npm install` — expect success; diff `package.json`/`package-lock.json` and confirm the only added deps are the `@radix-ui/react-*` primitives backing the first-batch shadcn components (and `@radix-ui/react-slot`/`class-variance-authority` if not already present). Confirm **no** backend deps, **no** Tanstack Query, **no** `@app/shared` dep, **no** DEFERRED-primitive deps.
2. Run `npm run typecheck` (root) — confirm exit 0. Adversarial: introduce a type error in the design-system route or a new `ui/*` file, re-run, confirm exit ≠ 0, then revert — proves strict TS actually checks the new code.
3. Run `npm run lint` (root, `biome check .`) — confirm exit 0 on the new TSX; confirm no new blanket Biome ignores were added to make it pass (open `biome.json`).
4. Run `npm --workspace @app/frontend run dev` — open `/design-system`; confirm all three sections render through `AppLayout` with no console errors. Confirm the first-batch primitives are visible with their variants.
5. Toggle the in-page theme control — confirm `.dark` flips on `<html>`, swatches + components recolor (light ↔ dark), and the choice persists across reload (localStorage `qc-theme`).
6. Reload with dark persisted and watch first paint — confirm **no light→dark flash** (anti-FOUC inline script works). Inspect `index.html` `<head>` to confirm the script is present, tiny, and `localStorage`-guarded.
7. Confirm Inter: inspect a typography sample's computed `font-family` (Inter). Confirm a swatch uses its token (e.g. `bg-primary`) and recolors on theme switch (token-driven, not hard-coded hex).
8. Run `npm --workspace @app/frontend run build` (and root `npm run build`) — confirm `dist/` builds with no errors. Optionally `preview` and load `/design-system`.
9. Run `npm --workspace @app/frontend run test` (`vitest run`) — confirm the design-system render test passes. Adversarial: break a section heading, confirm the test fails, then revert.
10. Scope guards: confirm NO header/sidebar shell or header theme switcher/custom-theme dropdown, NO `_app`/`_bare` split, NO auth pages, NO backend/Worker files, NO Query/`lib/api.ts` wiring, NO `@app/shared` import, NONE of the DEFERRED primitives added.
11. Clean-checkout edge case: delete `node_modules/` + reinstall; re-run `typecheck`/`lint`/`build`/`test`; confirm `git status` shows only intended `frontend/` additions plus the lockfile.

## Implementation notes (filled after implementation)
- **Files touched:**
  - Created: `frontend/src/routes/design-system.tsx` (the gallery route), `frontend/src/test/design-system.test.tsx` (Vitest + RTL render test).
  - Created (shadcn primitives, all under `frontend/src/components/ui/`): `input.tsx`, `label.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `card.tsx`, `tabs.tsx`, `badge.tsx`, `separator.tsx` (Button pre-existed from TICKET-003).
  - Modified: `frontend/index.html` (anti-FOUC inline script), `frontend/package.json` (new deps), root `package-lock.json` (lockfile sync).
  - Regenerated (git/Biome-ignored, not hand-edited): `frontend/src/routeTree.gen.ts` — now includes the `/design-system` route via codegen.
  - No changes to `__root.tsx` / `AppLayout.tsx` (the root `<Outlet/>` already surfaces the route; direct nav to `/design-system` works). No optional shell link added (kept scope minimal).
- **shadcn primitives added (CLI vs manual, per primitive) + exact `@radix-ui/*` versions:**
  - **All 11 generated via the shadcn CLI** (`npx shadcn@latest add input label textarea select checkbox radio-group switch card tabs badge separator`) so they use `components.json` (CSS-vars, `@/*` alias) like Button.
  - **In-file fixups after CLI (no config weakened, no blanket Biome ignores):** the current shadcn registry emits imports from the **unified `radix-ui` package** and uses `import * as React`. To match the existing foundation (Button already imports `@radix-ui/react-slot`) and the repo's exact-pin convention, I rewrote every Radix import to the **individual `@radix-ui/react-*` package** and switched type-only React imports to `import type * as React` (satisfies `verbatimModuleSyntax`). `badge.tsx` also had `Slot.Root` corrected to `Slot` (individual `@radix-ui/react-slot` export). This was an in-file edit per primitive — no manual re-authoring from docs was needed; the CLI-generated JSX/class strings were kept verbatim, only imports adjusted. Then `biome format` normalized quotes/commas.
  - **Exact `@radix-ui/react-*` versions added (all pinned exact, no `^`/`~`):** `react-label 2.1.11`, `react-switch 1.3.2`, `react-separator 1.1.11`, `react-checkbox 1.3.6`, `react-radio-group 1.4.2`, `react-tabs 1.1.16`, `react-select 2.3.2`. (`react-slot 1.3.0` already present from TICKET-003; Button/Badge reuse it.)
  - **Additional dep: `lucide-react 1.23.0`** (pinned exact) — required by the CLI-generated Select/Checkbox/RadioGroup for their check/chevron/circle icons; `components.json` already declares `iconLibrary: "lucide"`. lucide-react 1.23.0 lists React 19 in its peer range. This is a necessary transitive dep of the in-scope primitives, not scope creep.
  - After editing package.json to individual exact-pinned packages, ran `npm install` to sync the lockfile: the unified `radix-ui` package was removed; only the 8 top-level `@radix-ui/react-*` packages + their legitimate transitive Radix deps (react-popper, react-collection, @floating-ui/*, etc.) + lucide-react landed. No `@testing-library/user-event` was added — the toggle test uses `fireEvent` (already available).
- **In-page theme toggle + anti-FOUC script details:**
  - Toggle: a `Switch` in the page header wired to a local `useThemeToggle` hook that calls the EXISTING `lib/theme.ts` (`applyTheme`/`getStoredTheme` → `.dark` class + `qc-theme` localStorage). It is a DEMO control only — no FR-39 header switcher and no Zustand `themeStore` were built.
  - Anti-FOUC: a tiny dependency-free IIFE in `frontend/index.html` `<head>` **before** the module script, `try/catch`-guarded, reading the same `qc-theme` key and applying `.dark` to `<html>` pre-paint. Kept in sync with `lib/theme.ts` (same key + `.dark` mechanism). Verified present in `frontend/dist/index.html` after build.
  - Did NOT touch `index.css` (no token utility needed exposing — swatches use existing `bg-*`/`text-*` token utilities), so the `@custom-variant`/`@theme` ordering and the universal `border-color` rule are unchanged; no unintended borders observed in the grid.
- **Any first-batch component deferral (with rationale):** None — the full first batch (all 12 incl. Button) was implemented and showcased. No deferral needed.
- **Post-QA refinements (user-requested):** RadioGroup options + the Checkbox multi-select group are now rendered as **answer cards** — padded (`p-4`), subtly bordered (`border-input`, `rounded-lg`), with whole-row hover highlight (`hover:bg-accent`) — establishing the questionnaire answer-option pattern for upcoming builder/answering pages. All gates (typecheck / lint / build / test) re-verified green after the change.
- **Verification (real exit codes):** `npm install` → 0 (added the 7 new `@radix-ui/react-*` + `lucide-react`, removed unified `radix-ui`); `npm run typecheck` → 0; `npm run lint` (`biome check .`, 39 files) → 0; `npm run build` → 0 (`frontend/dist/` produced, includes `design-system` chunk); `npm --workspace @app/frontend run test` → 0 (3 tests pass: existing smoke + 2 new design-system tests); `npm run dev` binds on :5173 and serves `/design-system` (HTTP 200).
- **Review verdict:** code-reviewer **APPROVE WITH NITS** (no critical/major). Verified: `lucide-react 1.23.0` is legitimate (current latest, React 19 peer OK); Radix imports correctly rewritten to individual `@radix-ui/react-*` (no unified `radix-ui`), all exact-pinned; strict TS + Biome clean, no weakened flags/blanket ignores. Cosmetic nits: redundant `useEffect` in `useThemeToggle`; two form-label association styles coexist (nesting vs `htmlFor`+`id`); Badge `ghost`/`link` variants not showcased.
- **QA verdict:** **PASSED** — all 10 acceptance criteria PASS; adversarial tests confirmed strict TS catches errors and the render test catches heading regressions; reproducible from clean install; working tree byte-identical after QA. Note: computed `font-family:Inter` is not machine-verifiable in jsdom — verified indirectly (Inter bundled/applied); recommend a human eyeball in-browser.
- Follow-ups discovered (→ future tickets):
  - **(a) "Design-system batch 2" ticket** for the DEFERRED overlay/portal primitives (Dialog, Tooltip, DropdownMenu, Popover, Sheet, Toast/Sonner, Slider, Progress, Accordion, Avatar, Command, Table, Skeleton) — the Components section is structured (repeated `Showcase` blocks) so they slot in without rework.
  - **(b) FE-shell/header ticket** still owns the persistent FR-39 header theme switcher + custom-theme dropdown and the `_app`/`_bare` layout split.
  - **(c)** Decide a **canonical form-field label pattern** (nesting vs `htmlFor`+`id`) before builder/forms tickets copy it — two styles currently coexist on the showcase page.
  - **(d)** Backend Worker skeleton still deferred (re-create via `/next-ticket` later).
