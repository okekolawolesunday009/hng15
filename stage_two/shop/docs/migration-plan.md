# Migration Plan

## Scope

This plan is designed to preserve the current storefront while separating the system into a clearer multi-application architecture.

The current codebase is a single Next.js app. The migration should be incremental and reversible, not a destructive rewrite.

## Current Baseline

The project is already validated by a working toolkit:

- Next.js app router storefront
- Drizzle + Neon database schema and migrations
- NextAuth Google login with JWT sessions
- Mailgun email sends from server-side code
- PWA and mobile-friendly web shell
- Node test runner for core library tests

The important baseline is that the app already works as a monolith before separating concerns.

## Guardrails

Before any structural refactor:

1. Keep the current app running.
2. Avoid deleting existing routes or logic without proving they are unused.
3. Do not change auth, payments, or database ownership silently.
4. Do not introduce a new framework stack for the sake of novelty.
5. Prefer a stable API contract over ad hoc server actions.
6. Keep environment variable ownership explicit.

## Phase 1: Audit and Freeze the MBF

### Goal

Document where the current app owns logic and lock the architecture before any extraction.

### Actions

- confirm actual use of App Router and server actions
- map auth, DB, mail, and business logic ownership
- record environment variables and secrets
- document current dependencies and runtime expectations

### Exit Criteria

- architecture audit is written
- current boundaries are mapped
- no destructive changes are made

## Phase 2: Establish the New Structure

### Goal

Create the target monorepo or multi-app boundary without moving key functionality yet.

Recommended target structure:

```text
apps/
  frontend/
  backend/
  mobile/
packages/
  shared/
  types/
  validation/
  config/
```

### Actions

- create a separate backend app skeleton
- create a frontend app boundary for web UI
- create a mobile app boundary for native/mobile client
- define shared contracts in packages/

### Exit Criteria

- repository structure reflects ownership boundaries
- current storefront still runs unchanged

## Phase 3: Extract the Backend

### Goal

Make the backend the single source of truth for business logic, auth, DB access, validation, and integrations.

### Actions

- move DB access and ORM setup into backend-owned modules
- move Auth.js logic into backend runtime ownership
- centralize validation and API contracts
- expose backend routes or controllers for product, cart, auth, email, and checkout flows
- keep frontend and mobile from directly touching the database

### Exit Criteria

- backend runs independently
- database access is owned by the backend
- API contracts are defined and documented

## Phase 4: Rewire the Frontend

### Goal

Turn the Next.js app into a client-facing frontend that consumes HTTP API services rather than directly owning backend responsibilities.

### Actions

- create frontend API client layer
- replace direct data access with service calls
- keep only UI and browser concerns in frontend code
- maintain current storefront flows while adapting them to backend endpoints

### Exit Criteria

- frontend works without direct DB or secret access
- auth flow is mediated by backend API
- existing shop flows still work

## Phase 5: Add Mobile

### Goal

Introduce a mobile app that consumes the same API contract as the web frontend.

### Actions

- build mobile navigation and screens around the same business domains
- define auth flow for session management
- implement cart and product browsing against backend endpoints
- keep domain rules and validations server-owned

### Exit Criteria

- mobile app launches against the backend API
- no duplicate business logic is introduced

## Phase 6: Verification and Regression Coverage

### Goal

Validate the split architecture without leaving breakage behind.

### Actions

- run existing tests
- add API contract tests
- run frontend and backend build checks
- validate auth flows
- validate database and email integration

### Exit Criteria

- no unexplained regressions
- builds, lint, and type checks pass for affected surfaces

## Phase 7: Cleanup and Hardening

### Goal

Only after verification, remove redundant code and simplify the old architecture.

### Actions

- remove duplicate logic
- remove deprecated server routes or direct DB access
- update docs and environment examples
- tighten secrets, CORS, and API boundaries

### Exit Criteria

- project reflects the intended architecture
- no dead or duplicated backend code remains

## Recommended Sequence for This Repository

This app should follow this order:

1. audit and document current flows
2. define a backend API boundary
3. move auth, email, and database logic into backend ownership
4. convert web frontend into API consumer
5. add mobile app against the shared contract
6. remove stale couplings only after verification

## Migration Risks

### Authentication

Auth is the highest-risk change. The current app uses Google OAuth through NextAuth and stores session state in JWT form. This should be migrated carefully and not rewritten without preserving login behavior.

### Database Ownership

The database is currently accessed from the same app process. Extracting it into a backend service is the key architectural change.

### Payment / Order Confirmation

The current project explicitly defers payment confirmation and only sends emails after server-side verification. That policy should stay unchanged during migration.

### PWA / Mobile-Web Shell

The current PWA work is a valuable enhancement, but it does not replace native mobile architecture. It should be preserved while the mobile app is introduced separately.

## Decision Points to Confirm Before Execution

Before actual migration starts, confirm:

- whether the team wants a monorepo or separate repositories
- whether the target backend should be Node + Express/Nest or stay within Next.js runtime boundaries
- whether the mobile app should be Expo React Native
- whether a public API versioning strategy such as /api/v1 is required

## Final Recommendation

Do not begin with a destructive refactor. Begin with the API boundary, backend extraction, and contract definition. Keep the storefront app alive and stable while the backend and mobile surfaces are introduced around it.
