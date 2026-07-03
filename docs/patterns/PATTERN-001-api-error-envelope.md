# PATTERN-001 — API error envelope, AppError & validation

- **Status:** ACTIVE
- **Category:** backend (+shared)
- **Created:** 2026-07-03 · **Last updated:** 2026-07-03
- **Established by:** TICKET-007 · **Related:** `docs/ARCHITECTURE.md` §6.3 · `docs/DECISIONS.md` ADR-007 · `docs/patterns/PATTERN-003-backend-testing-workers-pool.md`

## Rule
Every API error returns the shared envelope `{ error: { code, message, details? } }` from `@app/shared`. Throw an `AppError(code, message, details?)` (or let a `ZodError`/validation failure surface) and let the central `onError` handler render it. Never hand-build error JSON in a handler.

## Rationale
One error shape across frontend and backend (ADR-007): the shape, the code→status map, and the Zod validator all live in `@app/shared` so codes never drift. Each code maps to the correct HTTP status, and unexpected errors return a generic 500 with no stack trace or internal message leaked to the client (ARCHITECTURE §6.3).

## How to apply

The canonical code→status map is the single source of truth in `shared/src/api/common.ts` — adding a code here is the only place a new error kind is declared:

```ts
// shared/src/api/common.ts
export const ERROR_STATUS = {
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL: 500,
} as const;
export type ErrorCode = keyof typeof ERROR_STATUS;

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: errorCodeSchema, // z.enum derived from ERROR_STATUS keys
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
```

Throw a domain error — its HTTP status is derived from its code (`backend/src/lib/error.ts`):

```ts
// backend/src/lib/error.ts
throw new AppError("NOT_FOUND", "Questionnaire not found");
// status is ERROR_STATUS[code]; details is only set when provided
// (exactOptionalPropertyTypes forbids an explicit details: undefined)
```

The central handler normalizes everything into the envelope (`backend/src/middleware/error-handler.ts`):

```ts
// backend/src/middleware/error-handler.ts
export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof AppError) {
    return c.json(toEnvelope(err.code, err.message, err.details), err.status);
  }
  if (err instanceof ZodError) {
    return c.json(
      toEnvelope("VALIDATION_ERROR", "Validation failed", flattenError(err)),
      ERROR_STATUS.VALIDATION_ERROR as ContentfulStatusCode,
    );
  }
  // Unexpected: log server-side ONLY, return a generic 500 (no leak).
  console.error("Unhandled error:", err);
  return c.json(toEnvelope("INTERNAL", "Internal server error"), 500);
}
```
Wired once in the app factory via `app.onError(errorHandler)` (`backend/src/app.ts`).

Validate inputs with the thin `zValidator` wrappers, which throw `AppError("VALIDATION_ERROR", …)` on failure so the handler above is the single place that renders the envelope (`backend/src/middleware/validate.ts`):

```ts
// backend/src/middleware/validate.ts
app.post("/questionnaires", validateJson(createSchema), (c) => { /* ... */ });
// validateJson / validateQuery / validateParam all throw AppError
// VALIDATION_ERROR with flattenError(result.error) as details on failure.
```

## Anti-patterns
- ❌ `c.json({ error: "..." }, 500)` ad hoc → ✅ `throw new AppError(...)` and rely on `onError`.
- ❌ leaking `err.message` / stack on a 500 → ✅ generic message + `console.error` server-side only.
- ❌ duplicating the envelope type in the backend → ✅ import `ErrorEnvelope` / `ErrorCode` / `ERROR_STATUS` from `@app/shared`.

## Scope & exceptions
Applies to all API error responses. Adding a new error code means adding it to `ERROR_STATUS` in `shared/src/api/common.ts` (which auto-updates the enum and status map) — do this rather than inventing per-handler shapes. Any deviation must be recorded in the ticket's Implementation notes and, if it changes the contract, in `docs/DECISIONS.md`.

## References
- Canonical implementation: `shared/src/api/common.ts`, `shared/src/index.ts`, `backend/src/lib/error.ts`, `backend/src/middleware/error-handler.ts`, `backend/src/middleware/validate.ts`, wired in `backend/src/app.ts`.
- `docs/ARCHITECTURE.md` §6.3 · `docs/DECISIONS.md` ADR-007 · TICKET-007.
