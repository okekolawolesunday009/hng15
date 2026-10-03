<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository guidance

- Run commands from this directory (`stage_two/shop`). Use the npm scripts in `package.json`; install dependencies with `npm ci` when needed.
- Before changing Next.js APIs or conventions, consult the installed documentation under `node_modules/next/dist/docs/`, as required above. Keep application code in `src/` and use the configured `@/*` alias for imports from `src/`.
- Keep TypeScript strict and follow the existing App Router, React, and ESLint conventions. Prefer focused changes over unrelated refactors.
- Keep credentials and environment-specific values in `.env`; never commit secrets or expose server-only credentials through `NEXT_PUBLIC_*`. Use `.env.example` for documenting required variable names with safe placeholders.
- Database schema definitions live in `src/db/schema/`; Drizzle migrations are in `src/db/migrations/`. For schema changes, generate migrations with `npm run db:generate` and review the generated SQL. Do not rewrite migrations that may already be applied. Run `npm run db:migrate` only against the intended database, and never against a shared or production database without explicit authorization.
- Keep authentication, database access, and Mailgun operations server-side. Validate untrusted input at server boundaries and scope signed-in user data to the authenticated user. Do not claim payment or order confirmation until a payment provider verifies success server-side; payment is currently deferred.
- After code changes, run the relevant checks: `npm run typecheck`, `npm run lint`, and `npm test`. Run `npm run build` when changes affect application compilation or production behavior. Tests use Node's test runner through `tsx` and are listed in the `test` script.
- Do not run `npm run mailgun:test` or other scripts that contact external services unless the required credentials and recipients are intentionally configured for testing.
