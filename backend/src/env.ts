// Worker bindings/environment contract for the backend (ARCHITECTURE §2.1).
// `Env` anticipates the D1 + R2 bindings and secrets that later phases wire
// up; `Variables` holds per-request context. `parseConfig` is a LAZY validator
// — never call it at module load, only where valid config is required.
import { z } from "zod";

// Cloudflare bindings + secrets. DB/BUCKET types are declared now so Phase 2
// only needs to flip on the real wrangler.toml blocks (no binding here yet).
export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  BETTER_AUTH_SECRET: string;
  CORS_ALLOWED_ORIGINS?: string;
}

// Per-request context set by middleware (e.g. hono/request-id).
export interface Variables {
  requestId: string;
}

// Minimal runtime-config schema. Kept lax for now (secrets optional) so the
// health test can run against an incomplete env; tighten in later phases.
const configSchema = z.object({
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(1).optional(),
});

export type Config = z.infer<typeof configSchema>;

// Validate the subset of env we treat as config. Call only where needed —
// invoking at import time would break requests running with an empty env.
export function parseConfig(env: Env): Config {
  return configSchema.parse(env);
}
