// Hono app factory (ARCHITECTURE §2.1/§2.2). Builds the typed app, mounts the
// non-auth middleware stack (CORS -> request-id -> logger), wires the central
// error handler, and registers the single shipped route GET /api/health.
// index.ts consumes this so the Worker entry stays free of route logic.
import { Hono } from "hono";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import type { Env, Variables } from "./env";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/error-handler";

// Create and configure the backend Hono application.
export function createApp(): Hono<{ Bindings: Env; Variables: Variables }> {
  const app = new Hono<{ Bindings: Env; Variables: Variables }>();

  // Middleware order: CORS first, then request-id, then logging.
  app.use("*", corsMiddleware);
  app.use("*", requestId());
  app.use("*", logger());

  // Central error handling for all routes.
  app.onError(errorHandler);

  // Liveness probe — the only shipped route in this phase.
  app.get("/api/health", (c) => c.json({ status: "ok" }));

  return app;
}
