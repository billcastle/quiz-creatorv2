# Setup Guides Index

User-facing setup guides for steps that **only a human can perform** — cloud provisioning, auth logins (`wrangler login`, `gh auth`), secrets / `.dev.vars`, DNS, real database ids, third-party accounts.

Agents **write** these (via `docs-keeper`, using `_TEMPLATE.md`); the **user follows** them. Whenever a ticket needs setup an agent can't do, a guide is created here and surfaced in the `/implement` summary with an "action required" note. See `CLAUDE.md` → "Setup Guides & Patterns".

| ID | Title | Status | Applies to | Related ticket |
|---|---|---|---|---|
| [GUIDE-001](GUIDE-001-local-dev-secrets.md) | Local development secrets (`.dev.vars`) | OPTIONAL → REQUIRED @ Phase 3 | local | TICKET-007 / TICKET-008 |
| [GUIDE-002](GUIDE-002-provision-d1-databases.md) | Provision preview & production D1 databases | PER-ENVIRONMENT | preview, production | TICKET-008 |

**Statuses:** REQUIRED · OPTIONAL · ONE-TIME · PER-ENVIRONMENT
