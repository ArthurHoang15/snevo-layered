# Phase Status

| Phase | Owner | Status | Notes |
|---|---|---|---|
| Phase 0 - Repo scaffold | Quan | Done | Project structure and layered backend folders created. |
| Phase 1 - Infrastructure layer | Quan | Done | Supabase singleton, error classes, constants, utilities, and compatibility wrappers added. |
| Phase 2 - Repository layer | Quan | Done | Done after remaining cleanup; stock/import/cart/featured behavior is explicitly deferred to Phase 3/5 where schema/reference inconsistency exists. |
| Phase 3 - Service layer | Nhan | Next | Move business rules into constructor-injected services. |
| Phase 4 - Presentation layer | Hoang | Pending | Port controllers, routes, and middleware as HTTP-only handling. |
| Phase 5 - Bootstrap, server, frontend/static, docs | Hoang | Pending | Wire container/server, restore frontend/static behavior, and finish docs. |

## Current Next Step

Implement Phase 3 service layer after the repository layer is reviewed or merged according to team workflow.

## Blocking Notes

- `REFACTOR_TEAM_PLAN.md` is currently local/ignored and should remain available for agents working in this workspace.
- `node_modules/` is local only and ignored.
- `Snevo-reference/schema.sql` does not define the `carts` table used by the reference cart model/frontend; Phase 5 schema verification must resolve or document this before full app equivalence.
- `Snevo-reference/schema.sql` does not define `shoes.is_featured`; featured product equivalence needs a Phase 3 response-shaping or Phase 5 schema decision.
