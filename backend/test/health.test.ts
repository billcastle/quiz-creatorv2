// Health-route smoke test under the real Workers runtime (SELF.fetch dispatches
// through the deployed Worker in workerd). Verifies GET /api/health stays green.
import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("GET /api/health", () => {
  it("returns 200 with { status: 'ok' }", async () => {
    const res = await SELF.fetch("http://x/api/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
