// Config-validation tests for env.ts. Confirms parseConfig rejects an invalid
// secret and accepts a valid/empty config.
import { describe, expect, it } from "vitest";
import { type Env, parseConfig } from "../src/env";

// Build a minimal Env for parsing; bindings are irrelevant to config parsing.
function makeEnv(overrides: Partial<Env>): Env {
  return {
    DB: {} as D1Database,
    BUCKET: {} as R2Bucket,
    BETTER_AUTH_SECRET: "valid-secret",
    ...overrides,
  };
}

describe("parseConfig", () => {
  it("fails when BETTER_AUTH_SECRET is an empty string", () => {
    expect(() => parseConfig(makeEnv({ BETTER_AUTH_SECRET: "" }))).toThrow();
  });

  it("passes for a valid config", () => {
    const env = makeEnv({
      BETTER_AUTH_SECRET: "s3cret",
      CORS_ALLOWED_ORIGINS: "http://localhost:5173",
    });
    const config = parseConfig(env);
    expect(config.BETTER_AUTH_SECRET).toBe("s3cret");
    expect(config.CORS_ALLOWED_ORIGINS).toBe("http://localhost:5173");
  });
});
