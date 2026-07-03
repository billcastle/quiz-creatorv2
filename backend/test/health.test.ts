import { describe, expect, it } from "vitest";
import app from "../src/index";

// Offline smoke test: `app.request` invokes the Hono handler in-process,
// with no Wrangler, miniflare, or Cloudflare account required.
describe("GET /api/health", () => {
  it("returns 200 with { status: 'ok' }", async () => {
    const res = await app.request("/api/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
