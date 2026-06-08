# Agent Rules

This file defines mandatory rules for AI agents working in this repository.

## Read First

Before planning or implementing, read these files when they exist:

1. `AGENTS.md`
2. `docs/ai/PROJECT_CONTEXT.md`
3. `docs/ai/PHASE_STATUS.md`
4. `REFACTOR_TEAM_PLAN.md`

## Project Goal

Refactor Snevo from the reference codebase into a clean layered architecture while preserving existing behavior, API endpoints, frontend behavior, and database schema compatibility.

## Architecture Rule

All backend code must follow this dependency direction:

```text
Presentation -> Business Services -> Data Repositories -> Infrastructure
```

Do not import upward across layers. Infrastructure must not import business or presentation code. Data repositories must not import services or controllers.

## Team Phase Ownership

- Quan: repo scaffold, infrastructure, Supabase singleton, base repository, repository layer.
- Nhan: business service layer and business validation.
- Hoang: presentation layer, routes, middleware, container/server wiring, frontend/static integration, docs.

## Commit Rules

- Keep commits small and scoped to one meaningful change.
- Do not copy the entire reference codebase in one commit.
- Do not copy `.git` from `Snevo-reference`.
- Do not use `git add .` unless the staged diff has been inspected.
- Before committing, run:
  ```powershell
  git status
  git diff --cached --stat
  ```
- Do not commit ignored local files such as `.serena/`, `node_modules/`, or local planning notes.

## Implementation Rules

- Preserve existing API endpoint URLs and response shapes unless the task explicitly changes them.
- Preserve frontend behavior and `schema.sql` compatibility during the refactor.
- Keep business logic out of controllers.
- Keep HTTP `req`/`res` objects out of services.
- Keep validation/business rules out of repositories.
- Do not add Express; this project uses the native Node.js `http` module.

## Documentation Rules

During plan execution, after each completed plan part or phase that changes code or project docs, update the relevant documentation immediately instead of waiting for a prompt reminder.

For each completed implementation task that changes code or project docs:

1. Append an entry to `docs/ai/IMPLEMENTATION_LOG.md`.
2. Update `docs/ai/PHASE_STATUS.md` if a phase or task status changed.

Prompt-only or agent-instruction-only changes do not require updates to `docs/ai/IMPLEMENTATION_LOG.md` or `docs/ai/PHASE_STATUS.md` unless the task explicitly asks for those docs to be updated.

Before final response, explicitly state whether the implementation log and phase status were updated.
