# PATTERN-002 — D1 + Drizzle schema conventions

- **Status:** ACTIVE
- **Category:** data
- **Created:** 2026-07-03 · **Last updated:** 2026-07-03
- **Established by:** TICKET-008 · **Related:** `docs/ARCHITECTURE.md` §3 · `docs/DECISIONS.md` ADR-002 · ADR-004 · `docs/patterns/PATTERN-001-api-error-envelope.md`

## Rule
Model every D1 table in `backend/src/db/schema.ts` using the D1 conventions below. Build the Drizzle client **per request** via `getDb(c.env.DB)` — never a module-level instance. Generate all primary-key ids with `newId()` (UUIDv7), never `crypto.randomUUID()`.

## Rationale
D1/SQLite has no native boolean, datetime, or JSON types, so those are stored via integer/text column modes. Workers has no persistent process state, so a global client is invalid — build one per request. UUIDv7 is time-ordered and sortable, which is index-friendly for PKs (ARCHITECTURE §3, ADR-002). Immutable published content lives as one JSON snapshot per version row (ADR-004).

## How to apply

Column-mode conventions (`backend/src/db/schema.ts`):

```ts
// booleans → integer boolean mode; timestamps → integer timestamp_ms;
// JSON → text json mode with a typed generic (NO Zod contract here — Phase 5).
likeCount: integer("like_count").notNull().default(0),
createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
snapshot: text("snapshot", { mode: "json" }).$type<unknown>().notNull(),
```

Text UUIDv7 PKs, generated with `newId()` at runtime (`backend/src/db/id.ts`):

```ts
// backend/src/db/id.ts
import { uuidv7 } from "uuidv7";
export const newId = (): string => uuidv7(); // sortable; NOT crypto.randomUUID()
```

Fractional-index `position` columns are TEXT strings (e.g. `"a0"`, `"a1"`). Intra-core FKs are declared with `.references()`; the one circular reference (`current_version_id` → `questionnaire_versions.id`) needs the `AnySQLiteColumn` return annotation for the forward reference:

```ts
currentVersionId: text("current_version_id").references(
  (): AnySQLiteColumn => questionnaireVersions.id,
),
```

**User-FK deferral convention:** columns that reference the not-yet-existing user table are plain `text` with NO `.references()`, plus a marker comment:

```ts
// FK→user.id completed in Phase 3 (better-auth tables)
ownerId: text("owner_id").notNull(),
```

Per-request client factory (`backend/src/db/client.ts`):

```ts
// backend/src/db/client.ts — no module-level instance
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
export function getDb(db: D1Database) {
  return drizzle(db, { schema });
}
```

Seed rows use DETERMINISTIC fixed ids + `.onConflictDoNothing()` for idempotency — the opposite of runtime rows, which use `newId()` (`backend/src/db/seed.ts`):

```ts
// backend/src/db/seed.ts — fixed ids so re-runs collide on the PK and no-op.
await db.insert(categories).values([
  { id: "cat_general", name: "General", slug: "general", position: "a0" },
  // ...
]).onConflictDoNothing();
```
Batch inserts stay well under D1's **100 bound-parameter limit** (one batched insert per table here).

## Anti-patterns
- ❌ `crypto.randomUUID()` for PKs → ✅ `newId()` (UUIDv7).
- ❌ module-level drizzle client → ✅ per-request `getDb(c.env.DB)`.
- ❌ storing booleans/dates as text → ✅ `integer({ mode: "boolean" })` / `integer({ mode: "timestamp_ms" })`.
- ❌ `newId()` for seed rows (breaks idempotency) → ✅ fixed ids + `.onConflictDoNothing()`.

## Scope & exceptions
Applies to all D1 tables and DB access. DB row types stay backend-only (ADR-007) — do NOT move `$inferSelect` types or schema into `shared/`. The user-FK deferral is temporary: those `.references()` are completed in Phase 3 when the better-auth user tables land. JSON columns get their Zod content contracts in Phase 5, not in the schema layer. Record any deviation in the ticket's Implementation notes / `docs/DECISIONS.md`.

## References
- Canonical implementation: `backend/src/db/schema.ts`, `backend/src/db/client.ts`, `backend/src/db/id.ts`, `backend/src/db/seed.ts`, migration `backend/migrations/0000_even_mephisto.sql`.
- `docs/ARCHITECTURE.md` §3 · `docs/DECISIONS.md` ADR-002 / ADR-004 · TICKET-008.
