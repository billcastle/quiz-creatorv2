// Schema smoke test in the real Workers runtime (workerd). Applies the
// generated migrations to the test D1, then exercises the seed + client factory
// against env.DB to prove the migrated schema and D1 binding work end-to-end.
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { getDb } from "../src/db/client";
import { categories } from "../src/db/schema";
import { seedCategories } from "../src/db/seed";

describe("categories seed (real D1 runtime)", () => {
  it("runs in workerd", () => {
    expect(navigator.userAgent).toBe("Cloudflare-Workers");
  });

  it("seeds the fixed category taxonomy", async () => {
    const db = getDb(env.DB);
    await seedCategories(db);

    const rows = await db.select().from(categories);
    expect(rows).toHaveLength(4);

    const slugs = rows.map((r) => r.slug);
    expect(slugs).toContain("general");
    expect(slugs).toContain("science");
    expect(slugs).toContain("history");
    expect(slugs).toContain("entertainment");
  });

  it("is idempotent (re-running does not duplicate rows)", async () => {
    const db = getDb(env.DB);
    await seedCategories(db);
    await seedCategories(db);

    const rows = await db.select().from(categories);
    expect(rows).toHaveLength(4);
  });
});
