# Target Architecture

## Recommended Architecture

```text
                 ┌──────────────────┐
                 │     FRONTEND     │
                 │     Next.js      │
                 └────────┬─────────┘
                          │
                          │ HTTPS API
                          │
                 ┌────────▼─────────┐
                 │     BACKEND      │
                 │     API/Logic    │
                 └───────┬─┬────────┘
                         │ │
                ┌────────┘ └─────────┐
                ▼                    ▼
          ┌──────────┐          ┌──────────┐
          │ Database │          │  External│
          │  Postgres│          │ Services │
          └──────────┘          │ Email    │
                                │ OAuth    │
                                └──────────┘

                 ▲
                 │ HTTPS API
                 │
          ┌──────┴──────┐
          │   MOBILE    │
          │ Expo/RN     │
          └─────────────┘
```

## Ownership Model

### Frontend Responsibilities

- UI and presentation
- route navigation
- form handling and local state
- API client layer
- mobile-friendly web experience
- no database access
- no server secrets

### Backend Responsibilities

- authorization and authentication
- business logic
- validation and request schemas
- database access
- external service integrations
- email and notifications
- product and order logic
- secure environment handling

### Mobile Responsibilities

- app shell and native navigation
- device-specific UX features
- API client and auth storage
- local state and offline experience
- UI only, not business rule enforcement

### Shared Responsibilities

- types and API contracts
- validation schemas
- shared constants
- environment contract docs

## Proposed Structure

```text
project/
├── apps/
│   ├── frontend/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── ...
│   ├── backend/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── db/
│   │   │   ├── services/
│   │   │   └── ...
│   │   └── ...
│   └── mobile/
│       ├── app/
│       ├── components/
│       ├── services/
│       └── ...
├── packages/
│   ├── shared/
│   ├── types/
│   ├── validation/
│   └── config/
├── docs/
├── package.json
└── ...
```

## API Boundary Proposal

The current project should eventually expose a versioned API such as:

- GET /api/v1/products
- GET /api/v1/products/:id
- GET /api/v1/categories
- GET /api/v1/cart
- POST /api/v1/cart/items
- DELETE /api/v1/cart/items/:id
- GET /api/v1/users/me
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- POST /api/v1/orders
- POST /api/v1/email/welcome

The key principle is that frontend and mobile become consumers, not owners.

## Authentication Boundary

The backend should own the authentication system.

Current app characteristics to preserve:

- Google OAuth provider
- JWT session strategy
- Drizzle adapter tables for auth entities
- user-scoped cart and order data

Target separation:

- backend handles token creation, validation, and OAuth callbacks
- frontend/mobile only consume the authorized session state
- secrets remain in backend env configuration only

## Database Ownership

The database should be owned by the backend and never directly accessed from frontend or mobile code.

Current database stack to preserve:

- Neon/Postgres
- Drizzle ORM
- schema definitions and migrations

## Environment Variable Ownership

| Variable | Current owner | Target owner | Secret? |
| --- | --- | --- | --- |
| DATABASE_URL | app | backend | Yes |
| GOOGLE_CLIENT_ID | app | backend/public config | Public |
| GOOGLE_CLIENT_SECRET | app | backend | Yes |
| JWT_SECRET-like values | app | backend | Yes |
| MAILGUN_API_KEY | app | backend | Yes |
| MAILGUN_DOMAIN | app | backend | Public-ish but app-specific |
| MAILGUN_FROM_EMAIL | app | backend | Public |
| NEXT_PUBLIC_* values | app | frontend only | Public |
| EXPO_PUBLIC_* values | app | mobile only | Public |

## Shared Contracts

A small shared package is appropriate for:

- API response schemas
- user and product types
- request validation schemas
- business constants

It should not contain:

- React components
- Next.js-specific server code
- browser-only functionality
- mobile-native components
- database models
- secrets

## Migration Principles

1. Keep the current storefront functioning.
2. Create a backend API boundary first.
3. Move database and auth logic to the backend.
4. Convert the web app to an API client.
5. Add mobile as a consumer of the same API.
6. Remove legacy direct DB access only after verification.

## Final Target State

When this migration is complete, the system should match the following rule:

- Web frontend: user interface and browser orchestration
- Backend: data, auth, validation, integrations, rules
- Mobile: native app experience using same backend API
- Shared packages: contracts and cross-platform schemas only

This provides a clean separation while preserving the actual storefront product and user workflow already present in the project.
