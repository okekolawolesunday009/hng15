# Architecture Audit

## Executive Summary

This repository is currently a single Next.js storefront application, not yet a separated frontend/backend/mobile architecture. The app contains the full transaction flow in one codebase: UI, server-side business logic, authentication, database access, and email delivery are all colocated under the App Router.

This means the current architecture is best described as a monolithic Next.js app with strong server-side responsibilities embedded in the same application boundary. That is workable for a small storefront, but it is not yet a clean platform architecture for a web frontend plus mobile app and shared backend.

## Current Repository Boundary

The project root in this workspace is:

- [stage_two/shop](../)

The main application code lives under:

- [stage_two/shop/src/app](../src/app)
- [stage_two/shop/src/components](../src/components)
- [stage_two/shop/src/lib](../src/lib)
- [stage_two/shop/src/db](../src/db)
- [stage_two/shop/src/auth.ts](../src/auth.ts)

## What Exists Today

### Frontend

The app is a Next.js App Router storefront with page-level UI and reusable components:

- [stage_two/shop/src/app/layout.tsx](../src/app/layout.tsx)
- [stage_two/shop/src/components/site-header.tsx](../src/components/site-header.tsx)
- [stage_two/shop/src/components/mobile-bottom-nav.tsx](../src/components/mobile-bottom-nav.tsx)
- [stage_two/shop/src/components/product-card.tsx](../src/components/product-card.tsx)
- [stage_two/shop/src/app/products/page.tsx](../src/app/products/page.tsx)
- [stage_two/shop/src/app/checkout/page.tsx](../src/app/checkout/page.tsx)

These files define the browser experience, navigation, product listings, cart, account and checkout flows.

### Backend

The application includes backend logic in the same project boundary, primarily via App Router server actions and auth handlers:

- [stage_two/shop/src/auth.ts](../src/auth.ts)
- [stage_two/shop/src/app/cart/actions.ts](../src/app/cart/actions.ts)
- [stage_two/shop/src/app/checkout/actions.ts](../src/app/checkout/actions.ts)
- [stage_two/shop/src/lib/catalog.ts](../src/lib/catalog.ts)
- [stage_two/shop/src/lib/mailgun.ts](../src/lib/mailgun.ts)
- [stage_two/shop/src/app/api/auth/[...nextauth]/route.ts](../src/app/api/auth/[...nextauth]/route.ts)

This is not a separate backend service yet. It is server-side logic inside the same Next.js application.

### Database

The database layer is PostgreSQL via Neon serverless and Drizzle ORM:

- [stage_two/shop/src/db/index.ts](../src/db/index.ts)
- [stage_two/shop/src/db/schema](../src/db/schema)
- [stage_two/shop/src/db/migrations](../src/db/migrations)

The project uses a database connection string from the environment and wires the database directly into the app layer.

### Authentication

Authentication is implemented with NextAuth and the Drizzle adapter:

- [stage_two/shop/src/auth.ts](../src/auth.ts)
- [stage_two/shop/src/db/schema/auth.ts](../src/db/schema/auth.ts)
- [stage_two/shop/src/db/schema/users.ts](../src/db/schema/users.ts)

Current characteristics:

- Google OAuth provider
- JWT session strategy
- Drizzle adapter for auth tables
- User session data injected into the app layout
- Protected and signed-in flows tied directly into the web app

### PWA / App Layer

The project is already configured as a mobile-like web app and includes PWA settings:

- [stage_two/shop/src/app/layout.tsx](../src/app/layout.tsx)
- [stage_two/shop/src/app/manifest.ts](../src/app/manifest.ts)
- [stage_two/shop/src/app/sw.ts](../src/app/sw.ts)
- [stage_two/shop/public/offline.html](../public/offline.html)

This is a strong starting point for a mobile-first web experience, but it is still not a separate native mobile codebase.

## Current Architecture Classification

| Category | Current status | Notes |
| --- | --- | --- |
| Frontend | Present | Next.js storefront UI and app shell |
| Backend | Embedded in Next.js | Server actions, route handlers, auth, email, DB access |
| Database | Present | Neon + Drizzle |
| Authentication | Present | NextAuth with Google + JWT |
| Shared code | Minimal | Mostly application-local types and utilities |
| Mobile | Not yet separate | No Expo/React Native app |
| Infrastructure | Minimal | Local env-based config, serverless DB |
| Testing | Present | Node test runner for selected libs |

## Dependency Map

Current dependencies show the app is intentionally full-stack but monolithic:

- Next.js 16 App Router
- React 19
- NextAuth
- Drizzle ORM
- Neon serverless Postgres
- Mailgun for transactional email
- Tailwind CSS
- Serwist for PWA/service worker
- Zod for validation

This is a good fit for a single app today, but it is not yet cleanly separated by responsibility.

## Architectural Conclusions

### Current Architecture

The application currently behaves like this:

- Browser loads Next.js app
- App layer reads session state from Auth.js
- Server actions hit the database directly
- Emails are sent from server-side code in the app
- UI and business logic are coupled together

### Separation Need

If the target is a real multi-surface architecture, the app should evolve into:

- Web frontend: presentation layer only
- Backend API: business logic, auth, database, external integrations
- Mobile app: user-facing native app requesting the same backend API
- Shared package: contracts, types, validation models

## Risks in the Current State

1. Business logic and UI are mixed together in the same app boundary.
2. Auth and database ownership are not isolated from the browser app.
3. There is no formal API contract between app surfaces.
4. Mobile cannot yet be added without duplicating logic or reusing backend code awkwardly.
5. Environment and secrets are currently shared within the same application runtime.

## Recommended Direction

Keep the current app working while introducing a clean separation in phases. The safest path is not a rewrite but a gradual extraction:

- keep the current app functional
- define backend ownership
- create a dedicated API boundary
- move business logic and DB access to a backend service
- keep web frontend consuming the backend API
- add mobile afterward against the same contract

## Final Assessment

The repository is not yet in a split-architecture state. It is a monolithic Next.js application with server-side responsibilities embedded in the app layer. It is a strong candidate for phased extraction, but it should not be rewritten in one step without creating the API boundary and migration plan first.
