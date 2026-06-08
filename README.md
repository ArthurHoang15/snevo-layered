# Snevo Layered

Snevo Layered is a refactor of the Snevo e-commerce project into a strict layered architecture.

## Architecture

The backend is organized around a one-way dependency rule:

```text
Presentation -> Business Services -> Data Repositories -> Infrastructure
```

The goal is to keep HTTP handling, business rules, database access, and shared infrastructure clearly separated while preserving the existing Snevo behavior.

- **Presentation Layer** (`backend/presentation/`): Handles HTTP routing, middleware processing, and parsing requests. Controllers delegate all business decisions to services.
- **Business Layer** (`backend/business/`): Contains services that run business rules and validate inputs. Free of HTTP concepts.
- **Data Layer** (`backend/data/`): Contains repositories that execute database queries/mutations using Supabase client primitives.
- **Infrastructure Layer** (`backend/infrastructure/`): Low-level concerns such as database clients, utility constants, and shared error classes.

Dependency injection is wired in `backend/container.js`, the composition root of the application.

## Tech Stack

- Node.js 18+
- ES Modules
- Native Node.js `http` module (no Express)
- Supabase PostgreSQL
- Vanilla HTML, CSS, and JavaScript frontend

## Setup & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=3001
   ```
   *Note: If environment variables are absent, the application starts in mock/fallback mode, which serving static frontend files safely.*

3. **Generate Configuration**:
   ```bash
   npm run dev:config
   ```

4. **Start Server**:
   For development:
   ```bash
   npm run dev
   ```
   For production:
   ```bash
   npm run start
   ```
