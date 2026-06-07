# Project Context

## Goal

Snevo Layered is a new repository that refactors the Snevo e-commerce reference project into layered architecture while keeping the original user-facing behavior intact.

## Repositories

- New repo: current clone root, referred to as `<SNEVO_LAYERED_ROOT>`.
- Reference repo: set per machine with `SNEVO_REFERENCE_PATH`.
- Architecture plan: set per machine with `SNEVO_REFACTOR_PLAN_PATH`.
- Team plan: `<SNEVO_LAYERED_ROOT>/REFACTOR_TEAM_PLAN.md` when available locally.

Suggested local setup for each member:

```powershell
cd <SNEVO_LAYERED_ROOT>
$env:SNEVO_LAYERED_ROOT = (Get-Location).Path
$env:SNEVO_REFERENCE_PATH = "<absolute-path-to-Snevo-reference>"
$env:SNEVO_REFACTOR_PLAN_PATH = "<absolute-path-to-SNEVO_REFACTOR_PLAN.md>"
```

## Tech Stack

- Node.js 18+
- ES Modules with `"type": "module"`
- Native Node.js `http` module, no Express
- Supabase PostgreSQL using schema `db_nike`
- Vanilla HTML, CSS, and JavaScript frontend

## Target Architecture

```text
Presentation -> Business Services -> Data Repositories -> Infrastructure
```

- Presentation handles HTTP controllers, routes, and middleware.
- Business services hold validation, orchestration, and business rules.
- Data repositories hold database queries only.
- Infrastructure holds Supabase setup, errors, constants, and shared utilities.

## Team Roles

- Quan owns repo bootstrap, infrastructure, and repository layer.
- Nhan owns business services.
- Hoang owns presentation, integration, frontend/static, and docs.

## Constraints

- Do not fork, mirror, or copy `.git` from the reference repo.
- Do not copy the full old codebase into one commit.
- Keep commit history readable and phase-scoped.
- Keep old API endpoints and response compatibility for the frontend.
- Keep frontend behavior and database schema compatibility unless explicitly changed.
