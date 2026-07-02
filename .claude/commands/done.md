---
description: User confirms the ticket is done - update docs, then commit, push, and open a PR
---

The user has confirmed this ticket is DONE: $ARGUMENTS
(If no ID given, use the ticket in AWAITING APPROVAL; if ambiguous, ask.)

Run the completion sequence:

1. Dispatch **docs-keeper**:
   - Ticket file → status DONE + completion date.
   - `docs/tickets/INDEX.md` → DONE.
   - `CONTEXT.md` → move to "What's done", update stack/decisions/next-step.
   - Update any other affected docs (ARCHITECTURE, DECISIONS, ROADMAP, frontend/backend READMEs).
2. Dispatch **ai-devops**:
   - Stage all relevant changes (code + docs).
   - Commit with conventional message including the ticket ID.
   - Push branch `ticket/###-short-name`.
   - Open a PR via `gh pr create` — title `[TICKET-###] <title>`; body with summary, changes, QA results, checklist.
   - If git remote or gh auth is missing, output the exact setup commands for the user instead.
3. Update INDEX.md with the PR link (docs-keeper; amend commit or note for next commit).
4. Report the PR URL and current project status.

Then STOP. Wait for the user to run `/next-ticket`.
