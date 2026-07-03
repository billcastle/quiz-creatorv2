// Cloudflare Worker entry. Builds the app via the createApp() factory and
// exports it as the default fetch handler. No route or middleware logic lives
// here — see app.ts.
import { createApp } from "./app";

const app = createApp();

export default app;
