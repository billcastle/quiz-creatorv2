// Shared API error-envelope contract (ARCHITECTURE §6.3).
// Single source of truth for the error code -> HTTP status map, the Zod
// schema that validates the `{ error: { code, message, details? } }` shape,
// and the inferred types consumed by both backend and frontend.
import { z } from "zod";

// Canonical error code -> HTTP status map. Adding a code here is the only
// place a new error kind needs to be declared.
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

// Zod enum derived from the map keys so codes never drift from the status map.
export const errorCodeSchema = z.enum(
  Object.keys(ERROR_STATUS) as [ErrorCode, ...ErrorCode[]],
);

// The wire shape every error response conforms to.
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
