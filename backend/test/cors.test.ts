// CORS behavior under the real Workers runtime (NFR-7). Asserts an allowlisted
// origin is reflected with credentials enabled and never `*`, and that a
// non-allowlisted origin is not reflected.
import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const ALLOWED = "http://localhost:5173";
const DISALLOWED = "https://evil.example.com";

describe("CORS", () => {
  it("reflects an allowlisted origin with credentials, never '*'", async () => {
    const res = await SELF.fetch("http://x/api/health", {
      headers: { Origin: ALLOWED },
    });

    const allowOrigin = res.headers.get("Access-Control-Allow-Origin");
    expect(allowOrigin).toBe(ALLOWED);
    expect(allowOrigin).not.toBe("*");
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("does not reflect a non-allowlisted origin", async () => {
    const res = await SELF.fetch("http://x/api/health", {
      headers: { Origin: DISALLOWED },
    });

    const allowOrigin = res.headers.get("Access-Control-Allow-Origin");
    expect(allowOrigin).not.toBe(DISALLOWED);
    expect(allowOrigin).not.toBe("*");
  });
});
