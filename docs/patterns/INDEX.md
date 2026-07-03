# Patterns & Standards Index

Conventions the **user and all agents must follow** — API/error shapes, route & handler structure, schema conventions, test-harness style, form/label patterns, naming, and process rules.

Agents **write/update** these (via `docs-keeper`, using `_TEMPLATE.md`) whenever a ticket **establishes, changes, or supersedes** a shared convention. `ai-dev` and `code-reviewer` consult this folder so new code matches established standards. See `CLAUDE.md` → "Setup Guides & Patterns".

| ID | Pattern | Category | Status | Established by |
|---|---|---|---|---|
| [PATTERN-001](PATTERN-001-api-error-envelope.md) | API error envelope, AppError & validation | backend | ACTIVE | TICKET-007 |
| [PATTERN-002](PATTERN-002-d1-drizzle-schema.md) | D1 + Drizzle schema conventions | data | ACTIVE | TICKET-008 |
| [PATTERN-003](PATTERN-003-backend-testing-workers-pool.md) | Backend testing / workers-pool (workerd) | testing | ACTIVE | TICKET-007 + TICKET-008 |

**Statuses:** ACTIVE · SUPERSEDED · DEPRECATED
