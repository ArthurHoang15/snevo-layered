# Project Context

## Goal

Snevo Layered is a new repository that refactors the Snevo e-commerce reference project into layered architecture while keeping the original user-facing behavior intact.

## Repositories

- New repo: `D:\Anh-Quan\A_pv_things\software-arch\Snevo-layered`
- Reference repo: `D:\Anh-Quan\A_pv_things\software-arch\Snevo-reference`
- Architecture plan: `D:\Anh-Quan\A_pv_things\SNEVO_REFACTOR_PLAN.md`
- Team plan: `REFACTOR_TEAM_PLAN.md` when available locally

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
