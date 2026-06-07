# Snevo Layered

Snevo Layered is a refactor of the Snevo e-commerce project into a layered architecture.

## Architecture

The backend will be organized around a one-way dependency rule:

```text
Presentation -> Business Services -> Data Repositories -> Infrastructure
```

The goal is to keep HTTP handling, business rules, database access, and shared infrastructure clearly separated while preserving the existing Snevo behavior during later phases.

## Tech Stack

- Node.js 18+
- ES Modules
- Native Node.js `http` module
- Supabase PostgreSQL
- Vanilla HTML, CSS, and JavaScript frontend

## Current Phase

This repository is currently in Phase 0: project structure scaffold only. Application code will be ported and refactored in later phases.
