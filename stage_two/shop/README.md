# Northstar Workspace

Northstar is split into three npm workspaces:

- `apps/frontend`: Next.js storefront and PWA shell.
- `apps/backend`: Auth.js, HTTP API, Neon/Drizzle persistence, and server integrations.
- `apps/mobile`: Expo / React Native storefront for native iOS and Android.
- `packages/shared`: shared API contracts.

## Setup

Use Node.js 24 or later. Run `npm install` from this directory. Copy `apps/frontend/.env.example` to `apps/frontend/.env` for the public app/backend URLs. Copy `apps/backend/.env.example` to `apps/backend/.env` and configure database, Auth.js/Google, and Mailgun secrets there. Set the backend `NEXT_PUBLIC_APP_URL` to `http://localhost:3000`; Google's local authorized redirect URI is `http://localhost:3000/api/auth/callback/google`.

## Run

Start these in separate terminals from the workspace root:

```powershell
npm run backend:dev
npm run dev
```

The storefront is at `http://localhost:3000`; backend health is at `http://localhost:4000/health`.
Start the mobile app with `npm --prefix apps/mobile run start`; see
[`apps/mobile/README.md`](./apps/mobile/README.md) for device networking setup.

## Checks

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`: frontend checks.
- `npm --prefix apps/mobile run typecheck`: mobile TypeScript check.
- `npm --prefix apps/backend run build`: backend typecheck.
- `npm --prefix packages/shared run build`: shared-contract typecheck.

Database commands and scripts belong to `apps/backend`; see its README. Do not run migrations against a shared or production database without authorization. Checkout currently fails closed because payment processing is deferred; no order is placed or confirmation sent.

See [the PWA implementation reference](docs/PWA_IMPLEMENTATION.md) and the architecture notes in `docs/` for further detail.
