# SPEC.md — Questionnaire Creator Web App

> Status: **CANONICAL — single source of truth.**
> Supersedes the intake placeholder. If any requirement changes, update this file and record the change in `docs/DECISIONS.md`.
> Last updated: 2026-07-02.

---

## 1. Overview

A TypeScript web application for **creating, publishing, and answering questionnaires**. A questionnaire is one of three types:

- **Quiz** — has right/wrong answers. Auto-graded where possible; Long-answer questions are manually graded by the author. Results screen shows a score plus a customizable message.
- **Survey** — no right/wrong answers. Collects opinions/feedback. Ends on a customizable completion message.
- **Scale** — multi-dimensional, MBTI-style. Answer options carry weights toward named dimensions/buckets; the combined dimension scores map to a customizable outcome (message + optional per-outcome results screen).

The app supports both anonymous and registered users. Every visitor gets a real user identity (anonymous session) so that anyone can create, answer, and like content without a friction wall, while retaining an owner for everything they produce.

### 1.1 Architecture at a glance

- **Monorepo:** `frontend/` and `backend/`, deployed separately, same ecosystem. TypeScript everywhere, strict mode.
- **Frontend:** Cloudflare Pages.
- **Backend:** Cloudflare Workers (Hono, per architecture decisions) exposing a JSON API.
- **Database:** Cloudflare **D1** (the only database), accessed via **Drizzle ORM** (D1 driver). Local dev via Wrangler / miniflare local D1.
- **Auth:** **better-auth**, sessions stored in D1. Uses the `anonymous` plugin and the `username` plugin.
- **File storage:** Cloudflare **R2** (tiptap images, avatars).
- **Domains:** FE and BE under one parent domain (e.g. `app.*` and `api.*`); cookies scoped to the parent domain; CORS allowlists the FE origin.
- **Rich text:** tiptap, stored as JSON, sanitized/validated server-side and on render.

Detailed technical design (tables, API contracts, deploy topology) lives in `docs/ARCHITECTURE.md`. This SPEC defines *what* is built and *why*; ARCHITECTURE defines *how*.

---

## 2. Personas & Roles

### 2.1 Personas

- **Anonymous visitor** — has an anonymous better-auth session (a real, anonymous user row). Can browse Explore, answer questionnaires, like, and create questionnaires. Owns everything they produce.
- **Registered user** — signed up with a **username OR email** (both unique) and a password. On sign-up/sign-in from an anonymous session, the anonymous account is **linked/merged** into the registered account.
- **Moderator** — a trusted registered user with elevated read/delete powers.
- **Admin** — full control plus user administration.

### 2.2 Role permission matrix

| Capability | Anonymous | User (registered) | Moderator | Admin |
|---|---|---|---|---|
| Browse Explore (public, published) | ✅ | ✅ | ✅ | ✅ |
| Answer any accessible questionnaire | ✅ | ✅ | ✅ | ✅ |
| Like / unlike | ✅ | ✅ | ✅ | ✅ |
| Create questionnaire | ✅ | ✅ | ✅ | ✅ |
| Edit **own** questionnaire | ✅ | ✅ | ✅ | ✅ |
| Delete **own** questionnaire | ✅ | ✅ | ✅ | ✅ |
| View **any** questionnaire (incl. private/drafts) | ❌ | ❌ | ✅ | ✅ |
| Delete **any** questionnaire (incl. private/drafts) | ❌ | ❌ | ✅ | ✅ |
| Edit **another user's** questionnaire | ❌ | ❌ | ❌ (view+delete only, no edit) | ✅ |
| Create Moderator / Admin accounts | ❌ | ❌ | ❌ | ✅ |
| Admin dashboard | ❌ | ❌ | ❌ | ✅ |

Notes:
- **Moderator** = view any + delete any (including private/drafts) but **cannot edit** others' content.
- **Admin** = full CRUD on any content + user management + admin dashboard (shown on login).
- The **first admin** is seeded via an env-configured migration/seed script.

---

## 3. Functional Requirements

### 3.1 Identity, accounts & sessions

- **FR-1 Anonymous session.** On first visit, the app establishes an anonymous better-auth session backed by a real (anonymous) user row. All content, likes, and responses created while anonymous are owned by that anonymous user id.
- **FR-2 Account merge on auth.** When an anonymous user signs up or signs in, their anonymous account is linked/merged into the target account: ownership of their questionnaires, likes, and responses transfers to the registered account.
- **FR-3 Registration.** A user registers with a **username** (unique, immutable) and/or **email** (unique) plus password. Login accepts **username OR email**.
- **FR-4 Username immutability.** Usernames cannot be changed after creation (guarantees a stable `/user/[username]` URL).
- **FR-5 Profile settings.** A registered user can edit **password**, **avatar**, and **email** only. Username is not editable.
- **FR-6 Avatars.** Uploaded to R2, max **10 MB**, server-side type/size validated, displayed **circular**.
- **FR-7 Roles.** Roles are `User`, `Moderator`, `Admin` per the matrix in §2.2. Only Admins create Moderator/Admin accounts.

**Acceptance (identity):**
- Given a brand-new visitor, When they create a questionnaire without signing in, Then the questionnaire has an owner id equal to their anonymous user id.
- Given an anonymous user who owns content, When they sign up, Then all that content is owned by the new registered account and no orphaned anonymous data remains referenced.
- Given a registered user, When they attempt to log in with either their username or their email plus correct password, Then login succeeds.
- Given any user, When they attempt to change their username, Then the operation is rejected/unavailable.

### 3.2 Questionnaire creation — common model

- **FR-8 Types.** A questionnaire has exactly one type: **Quiz**, **Survey**, or **Scale**.
- **FR-9 Questions & sections.** A questionnaire contains ordered **questions**, optionally grouped into named **Sections**. Ordering is stored via explicit `position`/`index` columns. Both questions and sections are **drag-sortable**.
- **FR-10 Question types (four):**
  1. **Single** — radio; respondent selects **exactly one** option.
  2. **Multiple** — checkboxes; respondent selects **one or more**. For quizzes, credit is awarded only on an **exact set match** with the correct options.
  3. **Short** — single-line text; author supplies **multiple acceptable answers** with a **per-question case-sensitivity toggle** (default: case-insensitive, trimmed). **Auto-graded.**
  4. **Long** — multi-line textarea; **manually graded** by the author.
- **FR-11 Optional toggle.** Each question has an **Optional** toggle. Fields are **required unless `Optional = true`**.
- **FR-12 Rich text prompts.** Question prompts (and other author-facing content) use tiptap, stored as JSON. Extensions enabled: **character-count**, **filehandler** (images, **5 MB** max, stored in R2), **color**. All tiptap content is sanitized/validated server-side before storage and again on render (XSS defense — prompts are shown to answerers).
- **FR-13 Results/outcome messages.** Results and outcome messages are authored via tiptap **without images**.

### 3.3 Behavior & presentation settings (per questionnaire)

- **FR-14 One question at a time.** Toggle; when on, the answerer sees a single question per screen.
- **FR-15 Paginated.** Available **only when "one question at a time" is on**; lets the answerer **jump to question N**.
- **FR-16 Fixed answer.** Available **only when "one question at a time" is on**; forward-only progression, hides the back button, and **overrides** the pagination jump.
- **FR-17 Shows answer on result.** Toggle controlling whether correct answers are revealed on the results screen.
- **FR-18 Visibility.** `Public` or `Private`.
  - Public + published: appears in Explore.
  - Private: accessible **only via a generated link**, excluded from Explore.
- **FR-19 Progress bar.** The quiz-answering progress bar color derives from the active theme.

### 3.4 Scoring & grading

- **FR-20 Quiz scoring.** Single and Multiple are auto-graded. Short is auto-graded against acceptable answers with the per-question case toggle. Long is **manually graded** by the author.
- **FR-21 Pending grades.** Until an author grades the Long answers in a response, that response's score is **"pending"**, and the results screen reflects that Long answers await grading.
- **FR-22 Manual grading UI.** The author has a grading UI to review and score Long answers per response.
- **FR-23 Survey.** No scoring; ends on a customizable completion message.
- **FR-24 Scale (multi-dimensional).** The author defines named **dimensions/buckets**. Each answer **option carries weights** toward one or more dimensions. The final outcome is derived from the winning/combined dimension scores and maps to a **customizable outcome** (message + optional per-outcome results screen). The author defines dimensions, per-option weights, and the outcome mapping.

**Acceptance (grading):**
- Given a quiz Multiple question, When a respondent selects a subset (not the exact correct set), Then no credit is awarded.
- Given a Short question with case-insensitivity on, When a respondent answers with different casing/whitespace of an accepted answer, Then it is marked correct.
- Given a quiz response containing an ungraded Long answer, When the results screen renders, Then the score shows "pending" and indicates Long answers await grading.
- Given the author grades all Long answers in a response, When grading is saved, Then the response score is finalized (no longer pending).
- Given a Scale questionnaire, When a respondent completes it, Then the outcome shown corresponds to the author's dimension-weight-to-outcome mapping.

### 3.5 Publishing, versioning & responses

- **FR-25 Publishing creates a version snapshot.** Publishing a questionnaire creates an **immutable version snapshot**.
- **FR-26 Edit-after-publish produces a new version.** Editing a published questionnaire creates a **new version**. The old version remains intact.
- **FR-27 Responses are version-bound.** Each response records **which version it answered**. Old responses remain valid against their version.
- **FR-28 Re-submission allowed.** A respondent may submit multiple times; **each submission is stored as its own response row**.
- **FR-29 Preview.** The author can preview through to the results screen from an **unsaved draft state** (client-side), before saving/publishing.

**Acceptance (versioning):**
- Given a published questionnaire with existing responses, When the author edits and re-publishes, Then a new version is created and prior responses still reference and grade against the version they were answered on.
- Given a respondent, When they submit twice, Then two distinct response rows exist.

### 3.6 Explore, likes & discovery

- **FR-30 Explore ranking.** Explore ranks questionnaires by **raw like count** (denormalized `like_count` counter per questionnaire).
- **FR-31 Explore filters & pagination.** Filterable by **category**. **Cursor-based pagination, 20 per page.**
- **FR-32 Explore exclusions.** Private questionnaires and drafts are **excluded** from Explore.
- **FR-33 Likes.** Any user (anonymous or registered) can like. Likes are **deduplicated by user id** (works for anonymous and registered).
- **FR-34 Categories.** A **seeded, fixed** list of categories with optional **seeded subcategories**. Users cannot create categories.

**Acceptance (discovery):**
- Given a private questionnaire or a draft, When Explore is queried, Then it does not appear.
- Given a user who already liked a questionnaire, When they like it again, Then the like count does not increase (dedup by user id).

### 3.7 Profiles

- **FR-35 Profile page.** `/user/[username]` shows a user's **published** questionnaires and their **liked** questionnaires only.
- **FR-36 Draft visibility.** Drafts are visible to the **owner only**, never on the public profile.

### 3.8 Themes & appearance

- **FR-37 Theme tokens.** Themes are shadcn-style CSS custom-property token sets committed as files in the repo (build-time). Adding a theme = adding a token file.
- **FR-38 Default themes.** Default is **white/light**; a **dark** theme is also provided.
- **FR-39 Theme switcher.** A theme switch + custom-theme dropdown lives in the **top-right header**.
- **FR-40 Typography.** Base font is **Inter**.

### 3.9 Blog

- **FR-41 Blog content.** Blog posts are `.md` files committed in a repo folder, parsed/rendered at **build time** (frontend/Pages). No blog CRUD UI and no DB storage for the blog in MVP.
- **FR-42 Blog routes.** `/blog` lists posts; `/blog/[slug]` renders one post.

### 3.10 Admin

- **FR-43 Admin dashboard.** Admins see an admin dashboard (a page shown on login) for user management and content oversight (create Moderator/Admin accounts, manage users/content per the role matrix).

---

## 4. Page Inventory (routes)

| Route | Purpose | Access |
|---|---|---|
| `/` | Landing / home | Anyone |
| `/explore` | Browse public, published questionnaires (ranked by likes, category filter, cursor pagination 20/page) | Anyone |
| `/q/new` | Create a **Quiz** | Anyone (owned by session) |
| `/s/new` | Create a **Survey** | Anyone |
| `/scale/new` | Create a **Scale** questionnaire *(clarified addition — see §6.3)* | Anyone |
| `/q/[id]` (and edit/answer variants) | View / answer / edit a questionnaire | Per visibility & role |
| `/q/[id]/grade` (or equivalent) | Manual grading UI for Long answers | Owner (+ Admin) |
| `/[private-link]` | Access a private questionnaire via generated link | Link holders |
| `/user/[username]` | Public profile: published + liked | Anyone; drafts owner-only |
| `/settings` | Profile settings: password, avatar, email | Registered user |
| `/blog` | Blog index (build-time from `.md`) | Anyone |
| `/blog/[slug]` | Single blog post | Anyone |
| `/admin` | Admin dashboard | Admin |
| Auth screens (sign up / sign in) | Registration & login (username or email) | Anyone |

> Exact route naming, params, and nesting are finalized in `docs/ARCHITECTURE.md`; the table above is the authoritative *set* of pages for MVP.

---

## 5. Data Entities (conceptual)

Conceptual entities only — physical schema (columns, indexes, FKs, JSON-as-TEXT handling for D1) is defined in `docs/ARCHITECTURE.md`.

- **User** — id, role (User/Moderator/Admin), `isAnonymous`, username (unique, immutable, nullable for anon), email (unique, nullable), avatar ref, timestamps. (better-auth `anonymous` + `username` plugins.)
- **Session / Account** — better-auth tables in D1.
- **Questionnaire** — id, ownerId, type (Quiz/Survey/Scale), title, description (tiptap JSON), visibility (Public/Private), draft/published state, private-link token, behavior flags (one-at-a-time, paginated, fixed-answer, shows-answer-on-result), denormalized `like_count`, category/subcategory refs, timestamps.
- **QuestionnaireVersion** — id, questionnaireId, versionNumber, immutable snapshot of the questionnaire content at publish time.
- **Section** — id (within a version), name, position/index.
- **Question** — id (within a version), sectionId (nullable), type (Single/Multiple/Short/Long), prompt (tiptap JSON), `isOptional`, position/index; type-specific config:
  - Single/Multiple: options + correctness (for quizzes).
  - Short: acceptable answers + `caseSensitive` toggle.
  - Long: no auto-grade config.
  - Scale option weights: per-option dimension weights.
- **ScaleDimension** — id, questionnaire/version ref, name.
- **ScaleOutcome** — id, mapping rule from dimension scores → outcome (tiptap message, optional per-outcome results screen).
- **Response** — id, questionnaireId, **versionId** (which version was answered), respondentUserId, submittedAt, computed score/outcome, grading status (`pending` | `graded` | `n/a`).
- **Answer** — id, responseId, questionId, value/selection, per-question grade (for manual Long grading).
- **Like** — (userId, questionnaireId) unique pair (dedup by user id); drives `like_count`.
- **Category / Subcategory** — seeded, fixed.
- **Blog** — not a DB entity in MVP; `.md` files in repo.

---

## 6. Resolved Decisions & Assumptions

### 6.1 Confirmed by the user (authoritative)

1. **Anonymous access** via better-auth `anonymous` plugin: every visitor = a real anonymous user row; anonymous users can create, answer, and like; likes dedup by user id; on sign-up/sign-in the anonymous account merges into the real account (ownership transfer). Registered users log in with **username OR email** (both unique) via the `username` plugin.
2. **Scale scoring** is multi-dimensional / MBTI-style: options carry weights toward named dimensions; outcome derives from combined scores and maps to a customizable outcome (message + optional per-outcome results screen); author defines dimensions, per-option weights, and mapping.
3. **Edit-after-publish** uses **full versioning/snapshots**: publishing creates an immutable version; each response records its version; editing produces a new version; old responses remain valid.
4. **Grading:** Short = author-supplied multiple acceptable answers + per-question case toggle (default case-insensitive, trimmed), auto-graded. Long = **manual** author grading via a grading UI; score is "pending" until graded and results reflect that.

### 6.2 Lead-adopted technical assumptions (to be confirmed by architect)

Marked `ASSUMPTION:` — adopted by the Lead in the absence of explicit user direction. The architect should validate these before build.

- `ASSUMPTION:` Uploads stored in **Cloudflare R2** with server-side type/size validation — tiptap images **5 MB**, avatars **10 MB**. Avatars rendered **circular**.
- `ASSUMPTION:` **Cloudflare D1** is the only database, via Drizzle's D1 driver; local dev on Wrangler/miniflare local D1. ("sqlite" in the original stack = D1.)
- `ASSUMPTION:` **Blog** = `.md` files committed in a repo folder, parsed/rendered at **build time** (frontend/Pages). No blog CRUD UI, no DB storage in MVP.
- `ASSUMPTION:` **Themes** = shadcn-style CSS custom-property token files committed at build time. Default white/light + a dark theme. "Add a theme" = add a token file. Theme switch + custom-theme dropdown top-right. **Inter** font. Progress bar color derives from active theme.
- `ASSUMPTION:` **FE (Cloudflare Pages)** and **BE (Cloudflare Workers)** live under one parent domain (`app.*` / `api.*`); cookies scoped to parent domain; CORS allowlists the FE origin; better-auth sessions stored in D1.
- `ASSUMPTION:` **First admin** seeded via an env-configured migration/seed script. Roles: User (CRUD own), Moderator (view + delete any incl. private/drafts, no edit), Admin (full CRUD any + user creation + dashboard). Admin dashboard shown on login.
- `ASSUMPTION:` **Explore** ranks by raw like count (denormalized `like_count`), category filter, cursor pagination 20/page; private & drafts excluded.
- `ASSUMPTION:` **Categories** are a seeded fixed list with optional seeded subcategories; not user-created.
- `ASSUMPTION:` **Rich text** (tiptap) stored as JSON, sanitized/validated server-side and on render; extensions: character-count, filehandler (images 5 MB), color.
- `ASSUMPTION:` **Usernames immutable** (stable `/user/[username]`). Profile settings edit password, avatar, email only. Other users' profiles show published + liked only; drafts owner-only.
- `ASSUMPTION:` **Re-submission** allowed; each response stored as its own row.
- `ASSUMPTION:` **Results/outcome messages** authored via tiptap **without images**.
- `ASSUMPTION:` **Question ordering** via explicit position/index columns; questions groupable into named Sections; both drag-sortable.
- `ASSUMPTION:` Behavior toggles: one-at-a-time; paginated (only if one-at-a-time; jump to Q N); fixed-answer (only if one-at-a-time; forward-only, hides back button, overrides pagination jump); shows-answer-on-result; visibility Public/Private (private via generated link, excluded from Explore).
- `ASSUMPTION:` **Preview** through to results from unsaved draft state (client-side).
- `ASSUMPTION:` **Testing:** Playwright E2E + Vitest for backend unit/route tests; every logic ticket adds/updates tests.

### 6.3 Clarified additions

- `CLARIFIED:` The original raw spec listed only `/q/new` and `/s/new`. A **Scale creation route** is added: proposed **`/scale/new`**. Flagged for architect confirmation of final naming.

---

## 7. Non-Functional Requirements

- **NFR-1 TypeScript strict mode** everywhere; no `any` without a justifying comment.
- **NFR-2 Input validation.** All API inputs validated with **Zod** on the backend.
- **NFR-3 Sanitization.** All tiptap/rich-text content sanitized and validated server-side before storage and again on render (XSS defense).
- **NFR-4 File limits.** Enforce type + size server-side: tiptap images 5 MB, avatars 10 MB; store in R2.
- **NFR-5 Accessibility basics.** Keyboard operability for core flows (answering, navigation; drag-sort has an accessible alternative), sensible labels/roles, sufficient contrast across themes.
- **NFR-6 Responsiveness.** Layouts usable on mobile and desktop.
- **NFR-7 Security.** Cookies scoped to the parent domain; CORS allowlists the FE origin only; role checks enforced server-side (never trust client role); private-link tokens unguessable.
- **NFR-8 Data integrity.** Version snapshots immutable; responses always resolvable to the version they answered.
- **NFR-9 Pagination limits.** Explore is cursor-paginated at 20 items/page; list endpoints bounded to prevent unbounded queries.
- **NFR-10 Testing.** Backend logic covered by Vitest; critical user journeys covered by Playwright E2E. Every logic-bearing ticket adds/updates tests.
- **NFR-11 Environments.** Separate local (miniflare) and deployed environments; secrets/config via env (incl. first-admin seed config).

---

## 8. Out of Scope for MVP

- User-created categories or subcategories (categories are seeded/fixed).
- Blog authoring UI or DB-backed blog (blog is build-time `.md` only).
- Editing usernames.
- Editing others' content by Moderators (Moderators view + delete only).
- OAuth / social login (auth is username-or-email + password + anonymous; no third-party providers in MVP unless added later).
- Runtime, user-uploaded custom themes (themes are build-time token files).
- Images in results/outcome messages.
- Real-time collaboration / multi-author editing of a single questionnaire.
- Email delivery flows (password reset, notifications) — not specified for MVP; flag for architect if better-auth requires it.
- Analytics dashboards beyond the admin oversight described.
- Export of responses (CSV/PDF).

---

## 9. Open Questions (for architect / next intake round)

- **OQ-1** Final route naming/nesting for create, edit, answer, grade, and the Scale route (`/scale/new` proposed).
- **OQ-2** Whether shared TypeScript types live in a shared package/folder or are duplicated per side (ARCHITECTURE decision; ADR-001 left this TBD).
- **OQ-3** Password reset / email verification flow — required? (Currently out of scope; better-auth email config may force a decision.)
- **OQ-4** Exact Scale outcome mapping semantics (winner-take-all vs. threshold bands vs. combined-score formula) beyond "winning/combined dimension scores."
- **OQ-5** Whether an anonymous user's content should have any TTL/cleanup if never merged.

---

## 10. Glossary

- **Questionnaire** — a Quiz, Survey, or Scale.
- **Quiz** — scored questionnaire with right/wrong answers.
- **Survey** — unscored questionnaire; ends on a completion message.
- **Scale** — multi-dimensional (MBTI-style) questionnaire; options weight dimensions that map to an outcome.
- **Question types** — Single (radio, exactly 1), Multiple (checkbox, 1+, exact-set match for credit), Short (text, acceptable answers + case toggle, auto-graded), Long (textarea, manually graded).
- **Section** — a named group of questions within a questionnaire; ordered and drag-sortable.
- **Version / snapshot** — an immutable capture of a questionnaire's content at publish time; responses bind to a version.
- **Response** — one submission of a questionnaire by a respondent, bound to a version.
- **Dimension / bucket** — a named axis in a Scale questionnaire that options weight.
- **Outcome** — the result of a Scale questionnaire, derived from dimension scores.
- **Pending grade** — a response state where Long answers await manual grading; score not yet finalized.
- **Explore** — the public discovery page (published + public only), ranked by like count.
- **Like** — a per-user, deduplicated endorsement; drives the denormalized `like_count`.
- **Anonymous session** — a real, anonymous user identity issued to every visitor via better-auth.
- **Merge / link** — transfer of an anonymous account's ownership to a registered account on sign-up/sign-in.
