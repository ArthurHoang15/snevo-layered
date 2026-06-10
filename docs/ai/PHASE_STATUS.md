# Phase Status

| Phase | Owner | Status | Notes |
|---|---|---|---|
| Phase 0 - Repo scaffold | Quan | Done | Project structure and layered backend folders created. |
| Phase 1 - Infrastructure layer | Quan | Done | Supabase singleton, error classes, constants, utilities, and compatibility wrappers added. |
| Phase 2 - Repository layer | Quan | Done | Done after remaining cleanup; stock/import/cart/featured behavior is explicitly deferred to Phase 3/5 where schema/reference inconsistency exists. |
| Phase 3 - Service layer | Nhan | Done | Constructor-injected services added; checkout, cart, payment, account, review, variant, import, and admin business rules now live in business layer. |
| Phase 4 - Presentation layer | Hoang | Done | Ported all 14 controllers, 4 middleware files, and 16 route files as HTTP-only. |
| Phase 5 - Bootstrap, server, frontend/static, docs | Hoang | Done | Wired DI container, server.js, frontend static assets, schema, scripts, and documentation. |

## Current Status

Refactoring completed successfully. The layered architecture is fully implemented, all dependencies are wired via the container, and the server boots correctly with no import or syntax errors.

## Bonus Readiness

| Bonus item | Status | Notes |
|---|---|---|
| Cloud provider deployment | Blocked | AWS/Azure/GCP account billing or student verification is not currently available. |
| CI/CD | Ready | GitHub Actions workflow runs env safety, architecture checks, and tests. |
| Monitoring/logging | Ready | Backend exposes health endpoint and structured JSON request/error logs. |
| Distributed system | Ready for local demo | Docker Compose runs separate API and frontend services. |

## Blocking & Architectural Notes

- `REFACTOR_TEAM_PLAN.md` is currently local/ignored and remains available for reference.
- `node_modules/` is local only and ignored.
- Supabase environment variables must be configured in a `.env` file at the root to run in full DB mode. If missing, the app runs in mock/fallback mode (allowing frontend serving while DB queries fail safely).
- `Snevo-reference/schema.sql` does not define the `carts` table used by the reference cart model/frontend; this remains documented for integration.
- `Snevo-reference/schema.sql` does not define `shoes.is_featured`.
- Phase 3 pricing defaults keep tax and shipping at 0.

