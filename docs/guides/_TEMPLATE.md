# GUIDE-### — <Short title: what this sets up>

- **Status:** REQUIRED | OPTIONAL | ONE-TIME | PER-ENVIRONMENT
- **Created:** YYYY-MM-DD · **Last updated:** YYYY-MM-DD
- **Performed by:** USER (a human — these steps are things an AI agent cannot or must not do)
- **Applies to:** local | preview | production (list the environments this is needed for)
- **Related:** TICKET-### · `docs/ARCHITECTURE.md` §X · `docs/patterns/PATTERN-###-...` (link anything relevant)

## Why this is needed
One or two sentences: what is blocked or broken until this is done, and why an agent can't do it for you (e.g. needs your cloud credentials, a browser login, a payment method, a secret only you hold).

## Prerequisites
- Accounts, tools, or access the user must already have (e.g. a Cloudflare account, `wrangler` installed, `gh` authenticated).

## Steps
Numbered, copy-pasteable. For commands the user should run **inside this Claude Code session**, prefix with `! ` so the output lands in the conversation; for commands they must run elsewhere (e.g. an interactive browser login), say so explicitly.

1. Step one.
   ```bash
   ! wrangler login
   ```
2. Step two.

## Verify it worked
The exact command + the expected output that confirms success.

```bash
! wrangler d1 list
# expect: the database name appears
```

## Values this produces (and where they go)
| Value | Where to put it | Notes |
|---|---|---|
| e.g. `database_id` | `backend/wrangler.toml` `[env.production]` | commit this (it is not a secret) |
| e.g. `BETTER_AUTH_SECRET` | `backend/.dev.vars` (local) / deploy secret | NEVER commit — `.dev.vars` is gitignored |

## If you skip this
What stays deferred/broken, and which tickets or phases are blocked until it's done.

## Troubleshooting
- Common error → fix.
