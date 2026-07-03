# GUIDE-001 — Local development secrets (`.dev.vars`)

- **Status:** OPTIONAL (today) → REQUIRED in Phase 3 (auth)
- **Created:** 2026-07-03 · **Last updated:** 2026-07-03
- **Performed by:** USER (an agent can't set your secret values)
- **Applies to:** local
- **Related:** TICKET-007 (`backend/src/env.ts` / `parseConfig`) · TICKET-008 (`backend/.dev.vars.example`) · `docs/patterns/PATTERN-001-api-error-envelope.md`

## Why this is needed
`backend/.dev.vars.example` lists the Worker secrets the app will eventually consume (`BETTER_AUTH_SECRET`, `FIRST_ADMIN_EMAIL`, `FIRST_ADMIN_PASSWORD`) as empty placeholders. No code reads them yet — TICKET-008 deferred first-admin bootstrap to Phase 3, and `parseConfig` (`backend/src/env.ts`) currently treats `BETTER_AUTH_SECRET` as optional (`z.string().min(1).optional()`), so nothing enforces them today. This becomes **required once auth lands (Phase 3)**. An agent can't do this for you: the actual secret values are yours to hold, not to commit.

## Prerequisites
- `wrangler` installed (comes with the backend dev dependencies).
- `openssl` (or any CSPRNG) available for generating a strong secret.

## Steps

1. Copy the committed template to your local, gitignored secrets file:
   ```bash
   ! cp backend/.dev.vars.example backend/.dev.vars
   ```
   Note: `.dev.vars` is gitignored; `.dev.vars.example` is the committed template — never rename or commit `.dev.vars`.

2. Fill `BETTER_AUTH_SECRET` with a strong random value:
   ```bash
   ! openssl rand -base64 32
   # paste the output as BETTER_AUTH_SECRET= in backend/.dev.vars
   ```

3. Leave `FIRST_ADMIN_EMAIL` and `FIRST_ADMIN_PASSWORD` empty for now — they are only wired up in Phase 3.

## Verify it worked
`wrangler dev` picks up `backend/.dev.vars` automatically when serving the Worker locally. The values are consumed by the Worker at runtime; nothing enforces them yet, so today "verify" simply means the file exists and `wrangler dev` starts without complaint:

```bash
! cd backend && wrangler dev
# expect: dev server starts; .dev.vars is loaded as local vars
```

## Values this produces (and where they go)
| Value | Where to put it | Notes |
|---|---|---|
| `BETTER_AUTH_SECRET` | `backend/.dev.vars` (local) / deploy secret for remote | NEVER commit — `.dev.vars` is gitignored |
| `FIRST_ADMIN_EMAIL` | `backend/.dev.vars` (local) / deploy secret for remote | NEVER commit; leave empty until Phase 3 |
| `FIRST_ADMIN_PASSWORD` | `backend/.dev.vars` (local) / deploy secret for remote | NEVER commit; leave empty until Phase 3 |

## If you skip this
Fine today — nothing reads these secrets yet and local dev/tests work without them. Once auth arrives (Phase 3), auth flows won't work until `BETTER_AUTH_SECRET` (and later the first-admin values) are set.

## Troubleshooting
- `wrangler dev` doesn't see a variable → confirm the file is `backend/.dev.vars` (not `.env`) and lives in the `backend/` folder.
- Committed a secret by mistake → rotate it immediately; `.dev.vars` should never be tracked.
