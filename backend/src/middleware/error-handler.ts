// Central Hono onError handler (ARCHITECTURE §6.3). Maps AppError and ZodError
// to the shared error envelope with the right HTTP status; any other error
// becomes a generic 500 with NO internal detail or stack trace leaked.
import { ERROR_STATUS } from "@app/shared";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError, flattenError } from "zod";
import { AppError, toEnvelope } from "../lib/error";

// Generic client-facing message for unexpected failures (no leakage).
const INTERNAL_MESSAGE = "Internal server error";

// Hono error handler: normalizes thrown errors into the shared envelope.
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

  // Unexpected error: log the real cause server-side only, return a generic
  // envelope so no stack trace or internal message reaches the client.
  console.error("Unhandled error:", err);
  return c.json(
    toEnvelope("INTERNAL", INTERNAL_MESSAGE),
    ERROR_STATUS.INTERNAL as ContentfulStatusCode,
  );
}
