// Backend error primitives built on the shared envelope contract.
// `AppError` is the throwable domain error (code -> status via ERROR_STATUS);
// `toEnvelope` renders any code/message/details into the shared wire shape.
// Respects exactOptionalPropertyTypes: `details` is only ever set when present.
import { ERROR_STATUS, type ErrorCode, type ErrorEnvelope } from "@app/shared";
import type { ContentfulStatusCode } from "hono/utils/http-status";

// Throwable error whose HTTP status is derived from its code.
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: ContentfulStatusCode;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_STATUS[code];
    // Only assign details when provided — exactOptionalPropertyTypes forbids
    // an explicit `details: undefined`.
    if (details !== undefined) {
      this.details = details;
    }
  }
}

// Render an error into the shared envelope shape, omitting `details` entirely
// when not supplied (conditional spread, never `details: undefined`).
export function toEnvelope(
  code: ErrorCode,
  message: string,
  details?: unknown,
): ErrorEnvelope {
  return {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
}
