// Core app schema for Cloudflare D1 (ARCHITECTURE §3). D1 conventions: text
// UUIDv7 PKs; integer{mode:"boolean"} bools; integer{mode:"timestamp_ms"}
// timestamps; text{mode:"json"} typed-generic JSON columns; FKs always enforced.
// DB row types stay backend-only (ADR-007) — no schema/row types in shared/.
import {
  type AnySQLiteColumn,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// categories (§3.6): fixed seeded taxonomy, unique slug.
export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    position: text("position").notNull(),
  },
  (t) => ({
    slugUnique: uniqueIndex("categories_slug_unique").on(t.slug),
  }),
);

// subcategories (§3.6): belong to a category; slug NOT globally unique.
export const subcategories = sqliteTable(
  "subcategories",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    position: text("position").notNull(),
  },
  (t) => ({
    categoryIdIdx: index("subcategories_category_id_idx").on(t.categoryId),
  }),
);

// questionnaires (§3.2): quiz/survey root; draft lives here, published content
// in questionnaire_versions. current_version_id is the circular forward-ref.
export const questionnaires = sqliteTable(
  "questionnaires",
  {
    id: text("id").primaryKey(),
    // FK→user.id completed in Phase 3 (better-auth tables)
    ownerId: text("owner_id").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    description: text("description", { mode: "json" }),
    visibility: text("visibility").notNull(),
    status: text("status").notNull(),
    privateLinkToken: text("private_link_token"),
    // Circular ref to questionnaire_versions.id (nullable so a questionnaire
    // can exist before its first version) — needs the AnySQLiteColumn return
    // annotation for the forward reference.
    currentVersionId: text("current_version_id").references(
      (): AnySQLiteColumn => questionnaireVersions.id,
    ),
    draftSnapshot: text("draft_snapshot", { mode: "json" }),
    likeCount: integer("like_count").notNull().default(0),
    categoryId: text("category_id").references(() => categories.id),
    subcategoryId: text("subcategory_id").references(() => subcategories.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    ownerIdIdx: index("questionnaires_owner_id_idx").on(t.ownerId),
    statusVisibilityIdx: index("questionnaires_status_visibility_idx").on(
      t.status,
      t.visibility,
    ),
    likeCountIdx: index("questionnaires_like_count_idx").on(t.likeCount),
    categoryIdIdx: index("questionnaires_category_id_idx").on(t.categoryId),
    privateLinkTokenUnique: uniqueIndex(
      "questionnaires_private_link_token_unique",
    ).on(t.privateLinkToken),
  }),
);

// questionnaire_versions (§3.3, ADR-004): one immutable JSON snapshot per row.
export const questionnaireVersions = sqliteTable(
  "questionnaire_versions",
  {
    id: text("id").primaryKey(),
    questionnaireId: text("questionnaire_id")
      .notNull()
      .references(() => questionnaires.id),
    versionNumber: integer("version_number").notNull(),
    type: text("type").notNull(),
    // Entire authored content; typed generic only — no Zod contract (Phase 5).
    snapshot: text("snapshot", { mode: "json" }).$type<unknown>().notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    // FK→user.id completed in Phase 3 (better-auth tables)
    createdBy: text("created_by").notNull(),
  },
  (t) => ({
    questionnaireVersionUnique: uniqueIndex(
      "questionnaire_versions_questionnaire_id_version_number_unique",
    ).on(t.questionnaireId, t.versionNumber),
    questionnaireIdIdx: index("questionnaire_versions_questionnaire_id_idx").on(
      t.questionnaireId,
    ),
  }),
);

// responses (§3.4): one row per submission; re-submission = multiple rows.
export const responses = sqliteTable(
  "responses",
  {
    id: text("id").primaryKey(),
    questionnaireId: text("questionnaire_id")
      .notNull()
      .references(() => questionnaires.id),
    versionId: text("version_id")
      .notNull()
      .references(() => questionnaireVersions.id),
    // FK→user.id completed in Phase 3 (better-auth tables)
    respondentUserId: text("respondent_user_id"),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
    gradingStatus: text("grading_status").notNull(),
    score: text("score", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    questionnaireIdIdx: index("responses_questionnaire_id_idx").on(
      t.questionnaireId,
    ),
    versionIdIdx: index("responses_version_id_idx").on(t.versionId),
    respondentUserIdIdx: index("responses_respondent_user_id_idx").on(
      t.respondentUserId,
    ),
  }),
);

// answers (§3.5): per-question answer within a response.
export const answers = sqliteTable(
  "answers",
  {
    id: text("id").primaryKey(),
    responseId: text("response_id")
      .notNull()
      .references(() => responses.id),
    // snapshot question id, not a DB FK
    questionId: text("question_id").notNull(),
    value: text("value", { mode: "json" }).notNull(),
    autoGrade: text("auto_grade"),
    manualGrade: text("manual_grade", { mode: "json" }),
  },
  (t) => ({
    responseIdIdx: index("answers_response_id_idx").on(t.responseId),
  }),
);

// likes (§3.7): composite PK dedups a user's like per questionnaire.
export const likes = sqliteTable(
  "likes",
  {
    // FK→user.id completed in Phase 3 (better-auth tables)
    userId: text("user_id").notNull(),
    questionnaireId: text("questionnaire_id")
      .notNull()
      .references(() => questionnaires.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.questionnaireId] }),
    questionnaireIdIdx: index("likes_questionnaire_id_idx").on(
      t.questionnaireId,
    ),
  }),
);

// Backend-only row types (ADR-007) — do NOT move to shared/.
export type Category = typeof categories.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
