// Thin @hono/zod-validator wrappers (ARCHITECTURE §2.2, ADR-009). On schema
// failure they throw an AppError so the central error-handler is the single
// place that renders the VALIDATION_ERROR envelope. No domain schemas here.
import { zValidator } from "@hono/zod-validator";
import { type ZodType, flattenError } from "zod";
import { AppError } from "../lib/error";

// Validate a JSON request body against `schema`.
export function validateJson<T extends ZodType>(schema: T) {
  return zValidator("json", schema, (result) => {
    if (!result.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Validation failed",
        flattenError(result.error),
      );
    }
  });
}

// Validate query-string params against `schema`.
export function validateQuery<T extends ZodType>(schema: T) {
  return zValidator("query", schema, (result) => {
    if (!result.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Validation failed",
        flattenError(result.error),
      );
    }
  });
}

// Validate path params against `schema`.
export function validateParam<T extends ZodType>(schema: T) {
  return zValidator("param", schema, (result) => {
    if (!result.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Validation failed",
        flattenError(result.error),
      );
    }
  });
}
