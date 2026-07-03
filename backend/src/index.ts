import { Hono } from "hono";

// Minimal Hono app for the questionnaire-creator backend Worker.
// This is the FIRST backend step: a single health route, exported as the
// Cloudflare Worker fetch handler. Middleware, bindings, and domain routes
// are added in later tickets.
const app = new Hono();

// Liveness probe: returns 200 with a stable JSON body.
app.get("/api/health", (c) => c.json({ status: "ok" }));

// On Cloudflare Workers, a Hono instance's default export satisfies the
// module Worker `{ fetch }` handler contract — no manual wrapper needed.
export default app;
