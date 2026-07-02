---
description: Ingest the full app spec, run gap analysis, ask clarifying questions, then write SPEC.md and ARCHITECTURE.md
---

The user is providing (or has provided) the full requirements for the questionnaire creator web app: tech stack, pages, features, and related requirements. Run spec intake:

1. Dispatch **ai-ba** to analyze the spec and produce a gap analysis + prioritized clarifying questions (each with a suggested default).
2. Present the questions to the user and WAIT for answers. Do not proceed on unconfirmed assumptions.
3. Once answered, have **ai-ba** write `docs/SPEC.md`.
4. Dispatch **architect** to write `docs/ARCHITECTURE.md` (system design, data model, API contract approach, folder structure for frontend/ and backend/, deployment topology) and seed `docs/DECISIONS.md`.
5. Dispatch **ai-team-producer** to write `docs/ROADMAP.md` with build phases (small steps, piece-by-piece).
6. Dispatch **docs-keeper** to update `CONTEXT.md` with the confirmed stack and status.
7. Summarize what was produced and tell the user to run `/next-ticket` when ready.

Do NOT create any tickets and do NOT write any application code during intake.

Spec input: $ARGUMENTS
