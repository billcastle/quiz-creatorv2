---
description: Implement a ticket using the feature-dev workflow (explore, clarify, design, implement, review, QA)
---

Implement the ticket specified in: $ARGUMENTS
(If no ticket ID given, use the single ticket currently in CREATED status; if ambiguous, ask.)

Follow the feature-dev workflow phases:

1. **Discovery:** Read the ticket file fully. Restate goal + scope in 2-3 sentences.
2. **Codebase exploration:** Dispatch **code-explorer** to map relevant existing code and patterns.
3. **Clarifying questions:** If the ticket + spec leave real ambiguity, ask the user now (via ai-ba if substantial). Skip if clear.
4. **Architecture design:** Dispatch **code-architect** for the implementation plan (skip multi-approach analysis for trivial tickets). Present the plan briefly.
5. **Implementation:** Have **ai-devops** create/switch to branch `ticket/###-short-name`, then dispatch **ai-dev** to implement strictly within scope. NO commits.
6. **Quality review:** Dispatch **code-reviewer** on the diff. If REQUEST CHANGES with high-confidence critical/major findings, loop back to ai-dev to fix, then re-review.
7. **QA pass (mandatory):** Dispatch **ai-qa** to run the QA pass against the ticket's acceptance criteria. Include real command output.
8. **Docs snapshot:** Dispatch **docs-keeper** to update the ticket file, INDEX.md, and CONTEXT.md (status: AWAITING APPROVAL).
9. **Summary:** Report to the user: what was built, review verdict, QA results, how to verify manually.

Then STOP and wait. The user decides if the ticket is done (`/done`) or needs rework. Do NOT commit, push, or create a PR. Do NOT start the next ticket.
