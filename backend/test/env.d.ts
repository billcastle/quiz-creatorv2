// Ambient types for the workers-pool test runtime. `env` from `cloudflare:test`
// is typed as `Cloudflare.Env`; extend that namespace with the D1 binding and
// the injected migrations array (this @cloudflare/vitest-pool-workers version
// types env via `Cloudflare.Env`, and exports `D1Migration` from cloudflare:test).
// This file is a module (top-level import), so the global namespace merge must
// go through `declare global`.
/// <reference types="@cloudflare/vitest-pool-workers/types" />
import type { D1Migration } from "cloudflare:test";
declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database;
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
