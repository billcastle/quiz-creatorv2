// Central app-side id generator. All DB primary keys are UUIDv7 (sortable,
// time-ordered) per ARCHITECTURE §3 — NOT crypto.randomUUID() (v4/random).
import { uuidv7 } from "uuidv7";
export const newId = (): string => uuidv7();
