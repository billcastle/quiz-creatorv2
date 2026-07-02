# Questionnaire Creator — AI Harness

AI engineering harness for building a questionnaire creator web app (quizzes + surveys) with **Claude Code**, using **Opus 4.7** as the lead agent and a team of specialized subagents, following the [feature-dev](https://claude.com/plugins/feature-dev) workflow with small, user-gated tickets.

## Setup

1. Unzip this into your workspace folder (it becomes the repo root).
2. `git init` (if not already a repo) and set your remote:
   ```bash
   git init && git add . && git commit -m "chore: bootstrap AI harness"
   git remote add origin <your-repo-url> && git push -u origin main
   ```
3. Make sure GitHub CLI is authenticated (needed for PRs on /done): `gh auth login`
4. (Recommended) Install the feature-dev plugin in Claude Code — this harness mirrors its workflow and includes compatible agents either way:
   ```
   /plugin install feature-dev@anthropic
   ```
5. Start Claude Code in this folder. `.claude/settings.json` pins the model to Opus 4.7 (`claude-opus-4-7`). Verify with `/model`.

## How to drive it

| Step | You type | What happens |
|---|---|---|
| 1 | `/intake <paste full spec>` | Gap analysis → clarifying questions → SPEC/ARCHITECTURE/ROADMAP written |
| 2 | `/next-ticket` | ONE small ticket created in `docs/tickets/` |
| 3 | `/implement TICKET-001` | Feature-dev workflow: explore → design → code → review → **automatic QA pass** |
| 4 | review the result | Re-run `/qa` or ask for fixes if needed |
| 5 | `/done TICKET-001` | Docs + CONTEXT.md updated → commit → push → PR |
| 6 | back to step 2 | Repeat, piece by piece |

## Layout

```
CLAUDE.md              ← agent instructions (read by Claude Code automatically)
CONTEXT.md             ← recovery snapshot; attach after a context reset
.claude/
  settings.json        ← model pinned to Opus 4.7
  agents/              ← 10 subagents (see below)
  commands/            ← /intake /next-ticket /implement /qa /done
docs/
  SPEC.md ARCHITECTURE.md DECISIONS.md ROADMAP.md WORKFLOW.md
  tickets/             ← _TEMPLATE.md, INDEX.md, TICKET-###-*.md
frontend/              ← frontend app (deployed separately)
backend/               ← backend app (deployed separately)
```

## Subagents

Your six: `ai-ba`, `ai-dev`, `ai-devops`, `ai-qa`, `ai-team-producer`, `architect`.
Added to complete the workflow: `code-explorer`, `code-architect`, `code-reviewer` (feature-dev phases 2/4/6), `docs-keeper` (CONTEXT.md + doc/ticket upkeep).

## Context recovery

If you clear the context: attach `CONTEXT.md` and say "context was cleared, resume". The agent re-reads INDEX.md, the current ticket, and git state before continuing.
