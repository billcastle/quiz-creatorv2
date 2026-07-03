# WORKFLOW.md — How This Project Gets Built

Based on Anthropic's **feature-dev** plugin workflow (discovery → codebase exploration → clarifying questions → architecture design → implementation → quality review → summary), adapted to a ticket-driven, user-gated process.

## The full loop

```
┌─────────────────────────────────────────────────────────────┐
│ 0. /intake      User gives full spec → ai-ba gap analysis   │
│                 → clarifying Qs → SPEC.md + ARCHITECTURE.md  │
│                 + ROADMAP.md                                 │
└─────────────────────────────────────────────────────────────┘
        │  (user: "/next-ticket")
        ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. /next-ticket ai-team-producer creates ONE feature ticket  │
│                 in docs/tickets/ → user reviews it           │
└─────────────────────────────────────────────────────────────┘
        │  (user: "/implement TICKET-###")
        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. /implement   Feature-dev phases:                          │
│    P1 Discovery ......... read ticket, restate scope        │
│    P2 Exploration ....... code-explorer maps the codebase   │
│    P3 Clarify ........... ask user if truly ambiguous       │
│    P4 Design ............ code-architect plans approach     │
│    P5 Implement ......... ai-dev codes on ticket branch     │
│    P6 Review ............ code-reviewer (fix loop if needed)│
│    P7 QA + Summary ...... ai-qa pass → docs-keeper snapshot │
│                           → report to user → WAIT           │
└─────────────────────────────────────────────────────────────┘
        │  (user reviews; may ask for fixes or /qa re-runs)
        │  (user: "/done TICKET-###")
        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. /done        docs-keeper updates all docs + CONTEXT.md    │
│                 → ai-devops commits, pushes, opens PR        │
└─────────────────────────────────────────────────────────────┘
        │
        └──► back to /next-ticket
```

## User gates (hard rules)

| Transition | Who triggers it |
|---|---|
| Create next ticket | **User only** (`/next-ticket`) |
| Start implementing | **User only** (`/implement`) |
| Mark ticket done | **User only** (`/done`) |
| Commit / push / PR | Agent, but **only after** `/done` |
| QA pass after implementation | **Automatic** (always) |

## Ticket sizing guide

Good ticket sizes (one ticket each): "Questionnaire CRUD — REST API routes + frontend list/create/edit pages" · "Auth flow — signup, login, session management (frontend + backend)" · "Response collection — answer submission API + respondent-facing quiz page" · "Results dashboard — aggregate stats API + frontend charts page".

Infrastructure/setup tickets may still be small (repo init, tooling, CI) — that's fine. Product features should always be full vertical slices.

Too big (split only if the PR would be unreviewable, >600 LOC diff): "build the entire app" · "do everything in the spec at once".

Too small (do not create these as standalone tickets): "create one migration" · "add one route" · "build one page skeleton" · "wire one form".

## Context recovery

If context is cleared: attach `CONTEXT.md`. The agent reads it + `docs/tickets/INDEX.md` + the current ticket + `git status`, confirms understanding, and resumes.
