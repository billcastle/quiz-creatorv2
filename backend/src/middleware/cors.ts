// CORS middleware (ARCHITECTURE §1.2, NFR-7). Reflects only allowlisted
// origins (from CORS_ALLOWED_ORIGINS env, defaulting to the local Vite dev
// server) and enables credentials. Never emits `*`. Auth-ready but contains
// no auth logic.
import type { Context } from "hono";
import { cors } from "hono/cors";
import type { Env, Variables } from "../env";

// Local Vite dev server; used when no allowlist is configured via env.
const DEFAULT_ORIGINS = ["http://localhost:5173"];

type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

// Parse the comma-separated allowlist from env, falling back to defaults.
// `env`/the var may be absent (unset binding or offline app.request), so guard.
function allowedOrigins(env: Env | undefined): string[] {
  const raw = env?.CORS_ALLOWED_ORIGINS;
  if (!raw) {
    return DEFAULT_ORIGINS;
  }
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

// Reflect the request origin only when allowlisted; otherwise return undefined
// so no `Access-Control-Allow-Origin` is set (never `*` with credentials).
export const corsMiddleware = cors({
  origin: (origin, c) => {
    const list = allowedOrigins((c as AppContext).env);
    return list.includes(origin) ? origin : undefined;
  },
  credentials: true,
});
