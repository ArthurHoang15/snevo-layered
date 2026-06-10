# Implementation Log

Append one entry after each completed implementation task that changes code or docs.

## 2026-06-07 - Phase 0 Repo Scaffold

**Actor:** Quan / AI-assisted

**Prompt summary:** Initialize a clean new repo scaffold for the Snevo layered refactor without copying the old codebase.

**Implemented:**
- Added root project scaffold files.
- Added empty top-level folders for backend, frontend, config, scripts, and docs.
- Added layered backend folder structure with `.gitkeep` markers.

**Architecture impact:**
- Established the target backend layer directories before porting application code.
- Kept the repo free of old MVC source code during initialization.

**Files changed:**
- `README.md`
- `.gitignore`
- `package.json`
- `backend/`
- `frontend/`
- `config/`
- `scripts/`
- `docs/`

**Verification:**
- Parsed `package.json`.
- Checked expected layer folders exist.
- Confirmed only scaffold files were tracked.

**Remaining notes:**
- Infrastructure implementation was left for Phase 1.

## 2026-06-07 - Gitignore Cleanup

**Actor:** Quan / AI-assisted

**Prompt summary:** Update ignore rules so local planning notes do not accidentally enter commit history.

**Implemented:**
- Changed `.gitignore` so `REFACTOR_TEAM_PLAN.md` is ignored.
- Kept `AGENTS.md` ignored at this point because the AI workflow docs had not been committed yet.

**Architecture impact:**
- No backend architecture or application behavior changed.
- Reduced risk of committing local planning files before the shared docs structure existed.

**Files changed:**
- `.gitignore`

**Verification:**
- Reviewed commit `2bb1344 chore: update gitignore`.

**Remaining notes:**
- Later AI workflow documentation removed `AGENTS.md` from `.gitignore` so shared agent rules could be committed.

## 2026-06-07 - Phase 1 Infrastructure

**Actor:** Quan / AI-assisted

**Prompt summary:** Add Supabase singleton, shared error classes, constants, order utilities, and compatibility wrappers.

**Implemented:**
- Added `backend/infrastructure/database/supabase.js`.
- Added `config/supabase.js` compatibility wrapper.
- Added shared error classes in infrastructure and old-path wrapper.
- Added shared constants and order utilities in infrastructure.
- Added `config/constants.js` compatibility wrapper.
- Added `@supabase/supabase-js` dependency.

**Architecture impact:**
- Moved database client setup into the Infrastructure layer.
- Replaced repeated `SupabaseConfig` factory instantiation with one singleton.
- Preserved old import paths through wrappers for later porting phases.

**Files changed:**
- `backend/infrastructure/database/supabase.js`
- `backend/infrastructure/errors/ErrorClasses.js`
- `backend/infrastructure/utils/constants.js`
- `backend/infrastructure/utils/orderUtils.js`
- `backend/utils/ErrorClasses.js`
- `config/supabase.js`
- `config/constants.js`
- `package.json`

**Verification:**
- Ran `npm install --package-lock=false`.
- Parsed `package.json`.
- Verified module imports for Supabase, constants, errors, and order utilities.
- Checked no infrastructure imports from `presentation/` or `business/`.
- Ran `npm test`, which exited 0 with 0 tests.

**Remaining notes:**
- Repository layer still needs to be created in Phase 2.

## 2026-06-07 - AI Workflow Documentation

**Actor:** AI-assisted

**Prompt summary:** Add the optimal AI workflow documentation structure with rules, context, implementation log, phase status, report notes, and architecture decisions.

**Implemented:**
- Added root `AGENTS.md` with mandatory AI rules.
- Added stable project context under `docs/ai/`.
- Added append-only implementation log and backfilled Phase 0 and Phase 1.
- Added phase status tracking.
- Added initial report notes and architecture decisions.
- Stopped ignoring `AGENTS.md` so it can be committed.

**Architecture impact:**
- No application architecture behavior changed.
- Added a repeatable workflow for future AI-assisted refactor tasks.

**Files changed:**
- `AGENTS.md`
- `.gitignore`
- `docs/ai/PROJECT_CONTEXT.md`
- `docs/ai/IMPLEMENTATION_LOG.md`
- `docs/ai/PHASE_STATUS.md`
- `docs/ai/REPORT_NOTES.md`
- `docs/architecture/DECISIONS.md`

**Verification:**
- Planned verification checks for docs presence, required rules, phase status, and architecture decision keywords.

**Remaining notes:**
- Future implementation tasks must append to this file before final response.

## 2026-06-07 - Portable Path Documentation

**Actor:** AI-assisted

**Prompt summary:** Replace machine-specific absolute paths in team docs so other members can clone the repo and use the AI context on their own machines.

**Implemented:**
- Replaced fixed local paths in project context with portable root placeholders and environment variables.
- Updated the team refactor plan to use `<SNEVO_LAYERED_ROOT>`, `SNEVO_REFERENCE_PATH`, and `SNEVO_REFACTOR_PLAN_PATH`.
- Updated reference-source examples and copy commands to use the configured reference repo path.

**Architecture impact:**
- No backend architecture or application behavior changed.
- Improved AI/documentation portability for collaborators.

**Files changed:**
- `docs/ai/PROJECT_CONTEXT.md`
- `REFACTOR_TEAM_PLAN.md`
- `docs/ai/IMPLEMENTATION_LOG.md`

**Verification:**
- Searched AI/team docs for the old machine-specific path strings; no machine-specific paths remained.

**Remaining notes:**
- Each team member still needs to set local environment variables to their own reference repo and architecture plan locations.

## 2026-06-07 - Phase 2 Repository Layer

**Actor:** Quan / AI-assisted

**Prompt summary:** Port old model data-access behavior into layered repository classes while removing validation concerns from repositories.

**Implemented:**
- Added `BaseRepository` with database-only CRUD/query helpers.
- Added product catalog repositories for shoes and categories.
- Added variant metadata repositories for colors, sizes, and shoe variants.
- Added cart, order, order item, payment, profile, address, review, and import repositories.
- Removed old repository `.gitkeep` marker after real repository files were created.

**Architecture impact:**
- Created the Data Repository layer under `backend/data/repositories`.
- Moved model data-access behavior toward repositories that use Infrastructure Supabase access.
- Kept validation/business rules out of repositories for Phase 3 services.

**Files changed:**
- `backend/data/repositories/BaseRepository.js`
- `backend/data/repositories/ShoeRepository.js`
- `backend/data/repositories/CategoryRepository.js`
- `backend/data/repositories/ColorRepository.js`
- `backend/data/repositories/SizeRepository.js`
- `backend/data/repositories/ShoeVariantRepository.js`
- `backend/data/repositories/CartRepository.js`
- `backend/data/repositories/OrderRepository.js`
- `backend/data/repositories/OrderItemRepository.js`
- `backend/data/repositories/PaymentRepository.js`
- `backend/data/repositories/ProfileRepository.js`
- `backend/data/repositories/AddressRepository.js`
- `backend/data/repositories/ReviewRepository.js`
- `backend/data/repositories/ImportRepository.js`

**Verification:**
- Planned static import checks for all repository modules.
- Planned layer-rule checks for forbidden `validationRules`, `BaseModel`, presentation, and business imports.
- Planned import whitelist check for repository imports.
- Planned `npm test` smoke check.

**Remaining notes:**
- Service layer still needs to be created in Phase 3.

## 2026-06-07 - Implementation Log Backfill Audit

**Actor:** AI-assisted

**Prompt summary:** Check old commits and update documentation for any completed implementation work not yet captured by `docs/ai/IMPLEMENTATION_LOG.md`.

**Implemented:**
- Compared chronological Git history against existing implementation log entries.
- Backfilled the missing `chore: update gitignore` commit as a standalone log entry.
- Confirmed merge commit `33724f0` does not need a separate implementation entry because it only merged already logged infrastructure/docs commits.

**Architecture impact:**
- No backend architecture or application behavior changed.
- Improved traceability between commit history and report-ready implementation notes.

**Files changed:**
- `docs/ai/IMPLEMENTATION_LOG.md`

**Verification:**
- Reviewed `git log --reverse --name-status`.
- Reviewed `git show 2bb1344 -- .gitignore`.
- Reviewed `git show 33724f0`.

**Remaining notes:**
- `AGENTS.md` currently has an unrelated unstaged local change that was not part of this backfill.

## 2026-06-08 - Phase 2 Repository Hardening

**Actor:** Quan / AI-assisted

**Prompt summary:** Harden repository behavior before Phase 3 so repository return shapes and data-access helpers better match `Snevo-reference`.

**Implemented:**
- Aligned product listing, detail, reviews, rating summary, soft delete, and restore metadata behavior in `ShoeRepository`.
- Hardened stock update operations with `increment`, `decrement`, `add`, `subtract`, and `set` aliases while clamping subtract/decrement to zero.
- Added duplicate-safe variant bulk creation and variant generation with `created/skipped` response metadata.
- Restored admin order list, order detail, payment parsing, address attach, and cart summary return shapes closer to the reference project.
- Added query-first helper methods for category name uniqueness and review purchase lookup while keeping old boolean wrappers for compatibility.

**Architecture impact:**
- Kept repository methods focused on database reads/writes and compatibility query helpers.
- Reduced Phase 3 service risk by making product, order, cart, stock, and variant query behavior closer to the reference data-access layer.
- Clarified that services still own validation, eligibility decisions, checkout orchestration, and final business rules.

**Files changed:**
- `backend/data/repositories/ShoeRepository.js`
- `backend/data/repositories/ShoeVariantRepository.js`
- `backend/data/repositories/OrderRepository.js`
- `backend/data/repositories/CartRepository.js`
- `backend/data/repositories/CategoryRepository.js`
- `backend/data/repositories/ReviewRepository.js`
- `docs/ai/IMPLEMENTATION_LOG.md`
- `docs/ai/REPORT_NOTES.md`
- `docs/ai/PHASE_STATUS.md`

**Verification:**
- Ran repository import smoke checks.
- Instantiated `ShoeRepository` without Supabase credentials.
- Ran static behavior checks for pagination, stock info, rating distribution, stock clamping, variant skipped metadata, parsed payments, and cart totals.
- Ran repository layer-rule and import whitelist checks.
- Ran `npm test`.
- Ran `npm start` and confirmed it still fails because `backend/server.js` is intentionally not implemented until Phase 5.

**Remaining notes:**
- Full app behavior equivalence remains impossible until Phase 3-5 add services, presentation/routes, server bootstrap, frontend/static files, schema, and scripts.

## 2026-06-08 - Phase 2 Repository Final Schema Cleanup

**Actor:** Quan / AI-assisted

**Prompt summary:** Finish Phase 2 repository hardening by removing schema mismatches and business decision wrappers before Phase 3 service work.

**Implemented:**
- Added repository contract smoke tests that run without Supabase credentials.
- Aligned order item writes and order total calculations to `price_per_unit`.
- Aligned payment writes to the reference `payments` schema and kept payment details encoded in `transaction_id`.
- Aligned import queries, writes, statistics, date filtering, and stock reversal to `quantity_imported`, `import_price`, `supplier_id`, and `import_date`.
- Removed repository business decision wrappers for category uniqueness, purchase verification, cart summary totals, and shoe restore preview decisions.

**Architecture impact:**
- Kept repository code focused on database reads/writes and raw query helpers.
- Moved validation, eligibility checks, pricing totals, restore decisions, and order/payment workflow choices to the future service layer.
- Preserved dependency direction by avoiding imports from `business/` or `presentation/`.

**Files changed:**
- `backend/data/repositories/OrderItemRepository.js`
- `backend/data/repositories/OrderRepository.js`
- `backend/data/repositories/PaymentRepository.js`
- `backend/data/repositories/ImportRepository.js`
- `backend/data/repositories/CategoryRepository.js`
- `backend/data/repositories/ReviewRepository.js`
- `backend/data/repositories/CartRepository.js`
- `backend/data/repositories/ShoeRepository.js`
- `test/repository-phase2-contract.test.js`
- `docs/ai/PHASE_STATUS.md`
- `docs/ai/IMPLEMENTATION_LOG.md`

**Verification:**
- Ran repository contract tests with `npm test`.
- Ran repository layer-rule scans for forbidden validation/business imports and schema-mismatched field names.
- Ran repository dynamic import smoke check.

**Remaining notes:**
- Full app behavior equivalence still waits for Phase 3-5 services, presentation/routes, server bootstrap, frontend/static files, and schema copy.

## 2026-06-08 - Phase 2 Strict Repository Cleanup

**Actor:** Quan / AI-assisted

**Prompt summary:** Remove remaining Phase 2 repository schema risks and business workflow helpers so services can own user-facing behavior in Phase 3.

**Implemented:**
- Expanded repository contract tests to catch schema-unsafe fields, business wrapper names, and repository workflow helpers.
- Made base soft delete and restore update only `is_active` so repositories do not write unsupported `deleted_at` columns.
- Removed payment detail parsing/generation, payment completion, and refund workflow helpers from `PaymentRepository`.
- Removed order payment detail enrichment and order total calculation from `OrderRepository`.
- Replaced category uniqueness-named helper with a neutral `findByName` query helper.
- Moved cart add-or-update workflow, address default orchestration, and variant generation workflows out of repositories.
- Aligned cart ordering to `added_at`, review ordering to `review_date`, removed `is_featured` filtering, and replaced import stock reversal RPC use with direct stock update.

**Architecture impact:**
- Repository layer now exposes database query/write primitives instead of business workflow decisions.
- Phase 3 services must recreate cart quantity rules, payment lifecycle behavior, default address behavior, variant SKU generation, response shaping, and order totals.
- Preserved dependency direction and kept Phase 2 limited to data repositories.

**Files changed:**
- `backend/data/repositories/BaseRepository.js`
- `backend/data/repositories/PaymentRepository.js`
- `backend/data/repositories/OrderRepository.js`
- `backend/data/repositories/CategoryRepository.js`
- `backend/data/repositories/ReviewRepository.js`
- `backend/data/repositories/CartRepository.js`
- `backend/data/repositories/AddressRepository.js`
- `backend/data/repositories/ShoeVariantRepository.js`
- `backend/data/repositories/ShoeRepository.js`
- `backend/data/repositories/ImportRepository.js`
- `test/repository-phase2-contract.test.js`
- `docs/ai/PHASE_STATUS.md`
- `docs/ai/IMPLEMENTATION_LOG.md`

**Verification:**
- Ran `npm test`.
- Ran repository layer-rule and schema-safety scans.
- Ran repository dynamic import smoke check.

**Remaining notes:**
- Reference `schema.sql` still does not define the `carts` table used by both reference and layered cart code; Phase 5 schema verification must resolve or document that mismatch.
- Full app behavior equivalence still waits for Phase 3-5 services, presentation/routes, server bootstrap, frontend/static files, and schema copy.

## 2026-06-08 - Phase 2 Remaining Repository Cleanup

**Actor:** Quan / AI-assisted

**Prompt summary:** Fix the remaining Phase 2 repository issues found in audit: review ordering schema mismatch, import/stock workflow leakage, and unresolved cart/featured schema inconsistencies.

**Implemented:**
- Updated repository contract tests to catch `ShoeRepository.getReviews()` ordering by unsupported review fields and to block stock/import workflow helper names in repositories.
- Changed `ShoeRepository.getReviews()` to order by `review_date`.
- Removed `ImportRepository.deleteWithStockReverse()` so import deletion and stock reversal can be composed by Phase 3 services.
- Removed `ShoeRepository.updateStock()` and replaced `ShoeVariantRepository.updateStock()`/`checkStock()` with raw `findStockById()` and `setStockQuantity()` primitives.
- Kept `CartRepository` and `ShoeRepository.getFeatured()` as Phase 2 query helpers without adding unsupported schema columns or migrations.

**Architecture impact:**
- Stock availability, stock add/subtract, import stock reversal, cart behavior, and featured product semantics are now explicitly service/schema follow-ups instead of repository decisions.
- Repository layer remains limited to schema-compatible reads/writes and query helpers.

**Files changed:**
- `backend/data/repositories/ImportRepository.js`
- `backend/data/repositories/ShoeRepository.js`
- `backend/data/repositories/ShoeVariantRepository.js`
- `test/repository-phase2-contract.test.js`
- `docs/ai/PHASE_STATUS.md`
- `docs/ai/IMPLEMENTATION_LOG.md`

**Verification:**
- Ran `npm test`.
- Ran repository layer-rule and remaining workflow/static scans.
- Ran repository dynamic import smoke check.

**Remaining notes:**
- Reference `schema.sql` still lacks `carts` and `shoes.is_featured`; Phase 5 must resolve or document these before claiming full app equivalence.
- Phase 3 services must recreate user-facing stock, cart, import reversal, and featured response behavior by composing repository primitives.

## 2026-06-08 - Phase 3 Service Layer

**Actor:** Nhan / AI-assisted

**Prompt summary:** Implement the Phase 3 business service layer for Snevo layered architecture, with `OrderService.createOrder()` as the critical workflow.

**Implemented:**
- Added constructor-injected services for products, categories, cart, orders, payments, profiles, addresses, reviews, variants, imports, and admin workflows.
- Moved business validation into services for product/category payloads, cart quantities, checkout inputs, payment methods/statuses, account data, reviews, variants, stock changes, and imports.
- Implemented `OrderService.createOrder()` to validate address/payment method, read cart items, calculate totals, create order and order items, decrement stock, create payment, auto-approve eligible orders, and clear the cart.
- Added service-layer contract tests, including a fake-repository checkout workflow test for `OrderService.createOrder()`.
- Removed the empty services `.gitkeep` after real service files were added.

**Architecture impact:**
- Established the Business Service layer under `backend/business/services`.
- Kept services free of HTTP request/response handling and direct Supabase access.
- Preserved dependency injection by receiving repositories through constructors rather than importing repository instances.
- Left controllers in Phase 4 responsible only for parsing HTTP input and calling these services.

**Files changed:**
- `backend/business/services/ProductService.js`
- `backend/business/services/CategoryService.js`
- `backend/business/services/CartService.js`
- `backend/business/services/OrderService.js`
- `backend/business/services/PaymentService.js`
- `backend/business/services/ProfileService.js`
- `backend/business/services/AddressService.js`
- `backend/business/services/ReviewService.js`
- `backend/business/services/VariantService.js`
- `backend/business/services/ImportService.js`
- `backend/business/services/AdminService.js`
- `backend/business/services/.gitkeep`
- `test/service-phase3-contract.test.js`
- `docs/ai/PHASE_STATUS.md`
- `docs/ai/IMPLEMENTATION_LOG.md`

**Verification:**
- Ran `npm install --package-lock=false` because local `node_modules` was missing.
- Ran `npm test`; all 9 tests passed.
- Ran service-layer scans for direct Supabase usage and presentation/HTTP imports; no matches.
- Ran a stricter HTTP token scan for standalone `req`/`res`, `writeHead`, and `.end(`; no matches.

**Remaining notes:**
- The prompt's literal `rg "req|res|writeHead|end\\(" backend/business/services` pattern is too broad and matches substrings such as `required`, `address`, and `restore`; use a token-aware scan such as `rg "\\b(req|res)\\b|writeHead|end\\(" backend/business/services`.
- Reference pricing behavior was not available locally because `SNEVO_REFERENCE_PATH` was not set and no `Snevo-reference` folder was found; Phase 3 uses injectable pricing policy defaults of zero tax and zero shipping until the reference rule is confirmed.

## 2026-06-08 - Phase 4 & 5 Presentation, Server, and Bootstrap

**Actor:** Hoang / AI-assisted

**Prompt summary:** Implement Phase 4 (presentation layer: controllers, middlewares, and routes) and Phase 5 (bootstrap: DI container, server, frontend copy, scripts, schema, and docs).

**Implemented:**
- Added 14 presentation controllers: `BaseController.js`, `ProductController.js`, `CategoryController.js`, `OrderController.js`, `CartController.js`, `PaymentController.js`, `ProfileController.js`, `AddressController.js`, `ReviewController.js`, `VariantController.js`, `ColorController.js`, `SizeController.js`, `ImportController.js`, `AdminController.js`.
- Implemented 4 middleware files: `auth.js`, `cors.js`, `upload.js`, `validation.js` in `backend/presentation/middleware/`.
- Implemented 16 routes in `backend/presentation/routes/` for product, category, order, admin order, cart, payment, authentication, users, profiles, addresses, review, variant, color, size, import, and admin.
- Created `backend/container.js` as the DI composition root, instantiating all repositories, services, and controllers with constructor injection.
- Ported and simplified `backend/server.js` to initialize the DI container, parse HTTP requests, route requests to controllers, and serve frontend static assets.
- Copied frontend static files (`assets`, `components`, `pages`) from `Snevo/frontend/` to `snevo-layered/frontend/`.
- Copied database `schema.sql` and `scripts` folder from reference to targets.
- Updated `package.json` with all dependencies and scripts from reference repository.
- Updated `supabase.js` config to support hybrid exports (both function call and instance call styles) for backward compatibility.
- Updated `container.js` with try-catch block for supabase initialization to prevent boot failure in mock mode when `.env` is absent.

**Architecture impact:**
- Successfully established layered architecture separation: Presentation Layer (`controllers`, `routes`, `middleware`) handles HTTP, Business Layer (`services`) handles business logic, Data Layer (`repositories`) handles query primitives, and Infrastructure handles database configuration and low-level details.
- Ensured DI container serves as the single composition root.
- Decoupled database connection failure from server boot, allowing fallback/static file serving in development without `.env`.

**Files changed/added:**
- `backend/presentation/controllers/*` (14 controllers)
- `backend/presentation/middleware/*` (4 middlewares)
- `backend/presentation/routes/*` (16 routes)
- `backend/container.js`
- `backend/server.js`
- `package.json`
- `backend/infrastructure/database/supabase.js`
- `schema.sql`
- `scripts/*` (7 scripts)
- `frontend/*` (assets, components, pages)
- `docs/ai/PHASE_STATUS.md`
- `docs/ai/IMPLEMENTATION_LOG.md`

**Verification:**
- Verified that controllers do not contain `setModels`, `data/repositories` imports, or direct `infrastructure/database` imports.
- Verified that services do not contain any presentation concerns (`req`, `res`, `writeHead`).
- Ran `npm install` and generated config using `npm run dev:config`.
- Successfully booted the server using `node backend/server.js` on port 3001, verifying no import, syntax, or wiring errors.

## 2026-06-10 - Bonus Readiness Without Cloud Billing

**Actor:** AI-assisted

**Prompt summary:** Cloud deployment is blocked by billing/student verification, so prepare the remaining bonus criteria first: CI/CD, monitoring/logging, and distributed-system demo.

**Implemented:**
- Added GitHub Actions CI workflow with env safety, layered architecture checks, and test execution.
- Added reusable npm scripts for `check:env`, `check:architecture`, and `ci`.
- Added environment safety scanner to prevent tracked `.env`/`local.env` files and common leaked token patterns.
- Added architecture scanner for service, repository, controller, and infrastructure dependency rules.
- Aligned the repository contract test with the current schema by allowing `suppliers.supplier_name` while still blocking old import/stock workflow fields.
- Sanitized `frontend/assets/js/config.js` so source control keeps safe placeholder defaults instead of local injected values.
- Added structured JSON logging with request IDs, request duration, status code, and error metadata.
- Added `/api/health` and `/health` endpoints for monitoring and container health checks.
- Added Dockerfiles and Docker Compose setup for separate local API and frontend containers.
- Added bonus documentation for CI/CD, monitoring/logging, distributed local demo, and evidence collection.

**Architecture impact:**
- Preserved the existing layered dependency direction.
- Kept observability utility code in Infrastructure and HTTP wiring in the server/bootstrap boundary.
- Added local distributed runtime evidence without requiring AWS/Azure/GCP billing.

**Files changed:**
- `.github/workflows/ci.yml`
- `package.json`
- `scripts/check-env-safety.js`
- `scripts/check-architecture.js`
- `backend/infrastructure/utils/logger.js`
- `backend/server.js`
- `frontend/assets/js/config.js`
- `Dockerfile.api`
- `Dockerfile.frontend`
- `docker-compose.yml`
- `docker/frontend/default.conf`
- `docs/bonus/BONUS_READINESS.md`
- `docs/bonus/CI_CD.md`
- `docs/bonus/OBSERVABILITY.md`
- `docs/bonus/DISTRIBUTED_LOCAL.md`
- `test/repository-phase2-contract.test.js`
- `docs/ai/PHASE_STATUS.md`
- `docs/ai/IMPLEMENTATION_LOG.md`

**Verification:**
- Ran `npm run ci`; env safety, architecture checks, and all 9 tests passed.
- Smoke-tested `/api/health` on a temporary local server and received `status: ok`.
- Captured structured JSON logs for `server_started` and `http_request`.
- Verified Git status keeps `local.env` ignored.
- Checked Docker availability; Docker is not installed in this local environment, so Compose build/run verification remains pending on a machine with Docker Desktop.

**Remaining notes:**
- Cloud provider deployment remains pending until the team gets AWS/Azure/GCP billing or student verification access.

## 2026-06-10 - AWS Runtime Frontend Auth Configuration

**Actor:** AI-assisted

**Prompt summary:** The AWS Elastic Beanstalk deployment is running, but Google login fails because the static frontend config still uses safe placeholder values.

**Implemented:**
- Added runtime generation for `/assets/js/config.js` in `backend/server.js` so AWS environment properties provide frontend-safe values such as `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `GOOGLE_CLIENT_ID`.
- Kept secrets out of source control; only public browser config is emitted, and `SUPABASE_SERVICE_ROLE_KEY` is not exposed to the frontend config script.
- Added a missing `Application.toggleMobileMenu()` method to prevent a frontend console error when the navbar toggler is clicked.

**Architecture impact:**
- Kept runtime configuration in the bootstrap/static serving boundary.
- Preserved the layered backend dependency direction; no service/repository/controller dependency changes were introduced.

**Files changed:**
- `backend/server.js`
- `frontend/assets/js/Application.js`
- `docs/ai/PHASE_STATUS.md`
- `docs/ai/IMPLEMENTATION_LOG.md`

**Verification:**
- Ran `npm run ci`; env safety, architecture checks, and all 9 tests passed.
- Smoke-tested `/api/health` and `/assets/js/config.js` on a temporary local server with production-like env vars.
- Verified runtime frontend config includes public Supabase/Google values and does not expose `SUPABASE_SERVICE_ROLE_KEY`.

