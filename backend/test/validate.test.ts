// Validation-helper tests. Mounts a test-only route guarded by validateJson
// and asserts an invalid body yields a 422 VALIDATION_ERROR envelope while a
// valid body passes through. No shipped domain endpoint is added.
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createApp } from "../src/app";
import { validateJson } from "../src/middleware/validate";

const schema = z.object({ name: z.string() });

describe("validate middleware", () => {
  it("returns a 422 VALIDATION_ERROR envelope on invalid body", async () => {
    const app = createApp();
    app.post("/__test__/validate", validateJson(schema), (c) =>
      c.json({ ok: true }),
    );

    const res = await app.request("/__test__/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: 123 }),
    });

    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("passes a valid body through to the handler", async () => {
    const app = createApp();
    app.post("/__test__/validate", validateJson(schema), (c) =>
      c.json({ ok: true }),
    );

    const res = await app.request("/__test__/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ok" }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
