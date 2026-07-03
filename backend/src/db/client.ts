// Per-request Drizzle client factory over the D1 binding (ARCHITECTURE §2.1).
// No module-level instance — Workers has no persistent process state; build
// one per request from c.env.DB.
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
export function getDb(db: D1Database) {
  return drizzle(db, { schema });
}
export type Db = ReturnType<typeof getDb>;
