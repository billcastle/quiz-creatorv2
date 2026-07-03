# GUIDE-002 — Provision preview & production D1 databases

- **Status:** PER-ENVIRONMENT (needed for Phase 18 deploy; NOT needed for local dev)
- **Created:** 2026-07-03 · **Last updated:** 2026-07-03
- **Performed by:** USER (needs your Cloudflare account / `wrangler login`)
- **Applies to:** preview, production
- **Related:** TICKET-008 (D1 `DB` binding + placeholder ids) · ROADMAP Phase 18 (deploy) · `docs/patterns/PATTERN-002-d1-drizzle-schema.md`

## Why this is needed
`backend/wrangler.toml` declares the D1 `DB` binding with **placeholder** `database_id`s: `local-placeholder-0000`, `preview-placeholder-0000`, `prod-placeholder-0000`. Local dev and tests build a D1 from the migrations via miniflare (no Cloudflare account required), so those placeholders are harmless locally. But deploying to preview/production needs **real** Cloudflare D1 databases and their real ids — which require your Cloudflare account and login. TICKET-008 deferred real provisioning to Phase 18. An agent can't do this: it needs your account credentials.

## Prerequisites
- A Cloudflare account.
- `wrangler` authenticated (`wrangler login` — an interactive browser login).

## Steps

1. Authenticate wrangler (opens a browser — run wherever you can complete the login):
   ```bash
   ! wrangler login
   ```

2. Create the preview and production databases, capturing the returned `database_id` for each:
   ```bash
   ! wrangler d1 create quiz-creator-api-preview
   ! wrangler d1 create quiz-creator-api-prod
   ```

3. Replace the placeholder ids in `backend/wrangler.toml` with the real ones:
   - `[env.preview]` → `database_id` = the preview id
   - `[env.production]` → `database_id` = the prod id
   - NOTE: the local `[[d1_databases]]` block is only used for local dev via `--local` and needs no real id.

4. Apply the migrations remotely to each environment:
   ```bash
   ! wrangler d1 migrations apply quiz-creator-api-preview --remote
   ! wrangler d1 migrations apply quiz-creator-api-prod --remote
   ```

## Verify it worked
```bash
! wrangler d1 list
# expect: quiz-creator-api-preview and quiz-creator-api-prod appear
```
The remote `migrations apply` output should report the tables it created.

## Values this produces (and where they go)
| Value | Where to put it | Notes |
|---|---|---|
| `database_id` (preview) | `backend/wrangler.toml` `[env.preview]` | commit this — it is NOT a secret |
| `database_id` (production) | `backend/wrangler.toml` `[env.production]` | commit this — it is NOT a secret |

## If you skip this
Local dev and tests work fine (miniflare builds D1 from migrations). You just can't deploy to preview/production until the databases are provisioned and their real ids are in `wrangler.toml`.

## Troubleshooting
- `wrangler d1 create` fails with an auth error → re-run `wrangler login`.
- Remote migrations apply nothing → confirm you replaced the placeholder id in the matching `[env.*]` block and used `--remote`.
