---
description: Create exactly ONE new ticket for the next small step, then stop
---

Create the next ticket — exactly one:

1. Dispatch **ai-team-producer**: read `docs/ROADMAP.md` and `docs/tickets/INDEX.md`, pick the next logical SMALL step (e.g., initialize project, install packages, create routes), and create `docs/tickets/TICKET-###-short-name.md` from `docs/tickets/_TEMPLATE.md`.
2. Have **ai-ba** supply acceptance criteria and **architect** supply technical notes for the ticket if needed.
3. Update `docs/tickets/INDEX.md` (status: CREATED).
4. Present the ticket to the user for review.

Then STOP. Do not implement. Do not create any further tickets. Wait for the user to run `/implement TICKET-###` (or request changes to the ticket).

$ARGUMENTS
