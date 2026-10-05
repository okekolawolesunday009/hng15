# Repository Guidance

## Workspace Layout

- `apps/frontend` owns the Next.js UI, PWA shell, and browser state. It must not access the database or hold backend credentials.
- `apps/backend` owns Auth.js, API routes, database schemas/migrations, validation, email integrations, and server-side business logic.
- `packages/shared` owns API contracts consumed by workspace clients.
- For Next.js-specific conventions, follow the generated instructions in `apps/frontend/AGENTS.md` and consult the installed Next.js docs before changing framework APIs.

## Commands

Run workspace commands from this directory. Start the backend and frontend in separate terminals with `npm run backend:dev` and `npm run dev`. The root `typecheck`, `lint`, `test`, and `build` scripts target the frontend; check backend code with `npm --prefix apps/backend run build` and shared contracts with `npm --prefix packages/shared run build`.

Database and email scripts belong to the backend package. Use `npm run db:generate` and `npm run db:migrate` from `apps/backend`; review generated migrations and never run them against a shared or production database without explicit authorization. Do not run Mailgun tests or other scripts that contact external services unless credentials and recipients are intentionally configured for testing.

## Security And Data

- Keep secrets in `apps/backend/.env`; only public app/backend URLs belong in `apps/frontend/.env`. Never put server secrets in `NEXT_PUBLIC_*` variables or commit `.env` files. Use package `.env.example` files with placeholders.
- Validate all untrusted API input and derive user identity from the Auth.js session cookie. Never trust a caller-provided user ID or authorization flag.
- Scope persisted carts and user data to the verified session. Keep guest cart storage limited to product IDs and quantities; derive prices and availability from backend data.
- Do not claim an order or payment succeeded until a payment provider verifies success server-side. Payment processing is currently deferred, and checkout must fail closed.
- Keep authenticated, cart, checkout, and API responses out of service-worker caches. The offline page is informational only.

## Quality

Keep TypeScript strict and changes focused. After edits, run the relevant checks: frontend `npm run typecheck`, `npm run lint`, and `npm test`; backend and shared-package typechecks when touched; and `npm run build` for frontend compilation or production behavior changes. Preserve unrelated worktree changes.
