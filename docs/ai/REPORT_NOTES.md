# Report Notes

Use these notes when drafting the final project report.

## Refactor Rationale

- The reference project mixed HTTP handling, business logic, database access, and utility concerns across controllers/models/server.
- The new repo is initialized cleanly so commit history shows the refactor process phase by phase.
- Layered architecture makes responsibilities easier to explain, review, and test.

## Before and After

- Before: MVC-style backend with controllers doing business workflows and models combining validation with data access.
- After target: presentation handles HTTP, services handle business logic, repositories handle data access, infrastructure handles shared technical setup.

## Contribution Story

- Quan started with repository bootstrap, infrastructure, and repository layer.
- Nhan will own service-layer business logic.
- Hoang will own presentation/integration/frontend/docs phases.

## Useful Evidence

- Phase 0 commits show clean scaffold instead of copying the full reference codebase.
- Phase 1 commits show Supabase singleton and infrastructure utilities isolated before repository/service work.
- Phase 2 commits show old model data access moved into repositories without carrying over validation rules.
- Phase 2 received a compatibility hardening pass before Phase 3 to reduce return-shape drift in product, variant, stock, cart, and order repository helpers.
- Future report writing can combine `REFACTOR_TEAM_PLAN.md`, `docs/ai/IMPLEMENTATION_LOG.md`, and `docs/architecture/DECISIONS.md`.
