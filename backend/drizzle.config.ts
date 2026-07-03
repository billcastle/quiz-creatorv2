// Drizzle Kit config — generate-only (D1/SQLite dialect). Application is via
// `wrangler d1 migrations apply`. No DB driver/native deps needed for generate.
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
});
