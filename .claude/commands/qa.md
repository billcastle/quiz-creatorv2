---
description: Run (or re-run) the QA pass for a ticket's current changes
---

Dispatch **ai-qa** to run a QA pass for the ticket: $ARGUMENTS
(If none specified, use the ticket currently in progress / awaiting approval.)

ai-qa must: run type-check/lint/build/tests for affected folders, verify every acceptance criterion with real evidence, probe edge cases, and report ✅ QA PASSED / ❌ QA FAILED with a criterion-by-criterion table.

If FAILED: summarize the bugs and ask the user whether to dispatch ai-dev to fix now. Do not fix silently. Do not mark anything done.
