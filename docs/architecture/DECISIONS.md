# Architecture Decisions

## ADR-001 - Use Layered Architecture

**Decision:** Organize backend dependencies as `Presentation -> Business Services -> Data Repositories -> Infrastructure` using layered architecture.

**Reason:** The reference project mixed HTTP handling, business logic, and data access. A strict layer direction makes ownership and refactor progress easier to validate.

## ADR-002 - Use a Supabase Singleton

**Decision:** `backend/infrastructure/database/supabase.js` exports a single shared `SupabaseConfig` instance. This is the project Supabase singleton.

**Reason:** The reference factory created a new config/client wrapper per call site. A singleton avoids repeated client setup and gives repositories one infrastructure entrypoint.

## ADR-003 - Keep Backward Compatibility Wrappers During Refactor

**Decision:** Old paths such as `config/supabase.js`, `config/constants.js`, and `backend/utils/ErrorClasses.js` forward to infrastructure.

**Reason:** Compatibility wrappers allow later phases to port files incrementally without breaking every old import at once.

## ADR-004 - Keep Commit History Clean

**Decision:** Port/refactor code in small phase-scoped commits and avoid copying the full reference codebase in one commit.

**Reason:** The team needs a readable history that shows actual refactor work and individual ownership.

## ADR-005 - Services Do Not Receive HTTP Objects

**Decision:** Business services must not accept `req` or `res`.

**Reason:** Services should expose plain business operations that controllers can call, keeping HTTP concerns in presentation.

## ADR-006 - Repositories Do Not Contain Business Validation

**Decision:** Repositories should handle database access only and should not keep old model `validationRules`.

**Reason:** Business validation belongs in services, while repositories should stay focused on queries and persistence.
