# Phase Status

| Phase | Owner | Status | Notes |
|---|---|---|---|
| Phase 0 - Repo scaffold | Quan | Done | Project structure and layered backend folders created. |
| Phase 1 - Infrastructure layer | Quan | Done | Supabase singleton, error classes, constants, utilities, and compatibility wrappers added. |
| Phase 2 - Repository layer | Quan | Next | Create repository layer from old models and remove validation rules from repositories. |
| Phase 3 - Service layer | Nhan | Pending | Move business rules into constructor-injected services. |
| Phase 4 - Presentation layer | Hoang | Pending | Port controllers, routes, and middleware as HTTP-only handling. |
| Phase 5 - Bootstrap, server, frontend/static, docs | Hoang | Pending | Wire container/server, restore frontend/static behavior, and finish docs. |

## Current Next Step

Implement Phase 2 repository layer after Phase 1 is reviewed or merged according to team workflow.

## Blocking Notes

- `REFACTOR_TEAM_PLAN.md` is currently local/ignored and should remain available for agents working in this workspace.
- `node_modules/` is local only and ignored.
