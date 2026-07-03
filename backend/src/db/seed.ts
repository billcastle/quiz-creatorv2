// Idempotent seed for the fixed category/subcategory taxonomy (SPEC FR-34).
// Names mirror TICKET-005's Sidebar placeholder; the canonical taxonomy is an
// ai-ba follow-up. Uses DETERMINISTIC fixed ids (not newId()) so re-runs collide
// on the PK and no-op via onConflictDoNothing — newId() is for runtime rows.
import type { Db } from "./client";
import { categories, subcategories } from "./schema";

export async function seedCategories(db: Db): Promise<void> {
  // One batched insert per table (well under the 100 bound-param limit).
  await db
    .insert(categories)
    .values([
      { id: "cat_general", name: "General", slug: "general", position: "a0" },
      { id: "cat_science", name: "Science", slug: "science", position: "a1" },
      { id: "cat_history", name: "History", slug: "history", position: "a2" },
      {
        id: "cat_entertainment",
        name: "Entertainment",
        slug: "entertainment",
        position: "a3",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(subcategories)
    .values([
      {
        id: "sub_physics",
        categoryId: "cat_science",
        name: "Physics",
        slug: "physics",
        position: "a0",
      },
      {
        id: "sub_biology",
        categoryId: "cat_science",
        name: "Biology",
        slug: "biology",
        position: "a1",
      },
    ])
    .onConflictDoNothing();
}
