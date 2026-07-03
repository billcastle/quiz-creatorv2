// Error-handler contract tests. Builds an app with throwing test routes and
// asserts AppError maps to the correct status + shared envelope shape, and a
// plain Error becomes a generic 500 with no stack/internal message leaked.
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { AppError } from "../src/lib/error";

describe("error envelope", () => {
  it("maps AppError to its status + shared envelope shape", async () => {
    const app = createApp();
    app.get("/__test__/app-error", () => {
      throw new AppError("NOT_FOUND", "Thing not found");
    });

    const res = await app.request("/__test__/app-error");
    expect(res.status).toBe(404);

    const body = (await res.json()) as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Thing not found");
  });

  it("maps a plain Error to a generic 500 with no leakage", async () => {
    const app = createApp();
    app.get("/__test__/boom", () => {
      throw new Error("secret internal detail /Users/secret/path");
    });

    const res = await app.request("/__test__/boom");
    expect(res.status).toBe(500);

    const raw = await res.text();
    expect(raw).not.toContain("secret internal detail");
    expect(raw).not.toContain("/Users/secret/path");

    const body = JSON.parse(raw) as {
      error: { code: string; message: string };
    };
    expect(body.error.code).toBe("INTERNAL");
    expect(body.error.message).toBe("Internal server error");
  });
});
