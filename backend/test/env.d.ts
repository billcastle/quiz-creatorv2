// Ambient types for the workers-pool test runtime, so `cloudflare:test`
// exports (SELF, env) resolve in tests without adding the pool types to the
// shared tsconfig `types` array.
/// <reference types="@cloudflare/vitest-pool-workers/types" />
