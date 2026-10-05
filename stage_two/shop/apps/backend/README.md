# Backend

This package owns the HTTP API, Auth.js, database access, and backend integrations.

Current status:

- catalog queries and guest/signed-in cart operations use the backend database
- Auth.js Google OAuth, session, CSRF, and sign-out endpoints are served here
- checkout validates input but rejects until a payment provider is configured

Responsibilities:

- authentication and authorization
- database access and migrations
- business logic and validation
- external service integration
- email, webhooks, and order operations

Non-responsibilities:

- UI rendering
- browser-only behavior
- native/mobile-specific logic

Run backend commands from this directory. Copy `.env.example` to `.env` and configure database, Auth.js, and Mailgun values here. Browser Auth.js requests are proxied through the frontend so session cookies are first-party. Set `NEXT_PUBLIC_APP_URL` to the frontend origin; the backend uses it as the public origin for Auth.js requests. Register `<frontend-origin>/api/auth/callback/google` as the Google authorized redirect URI. For native Google sign-in, set `GOOGLE_MOBILE_CLIENT_IDS` to a comma-separated allowlist of the Android and iOS OAuth client IDs configured in `apps/mobile/.env`. The app does not send Google client secrets to the backend exchange endpoint or include them in the mobile bundle. The frontend needs `NEXT_PUBLIC_BACKEND_URL` set to the backend origin and `NEXT_PUBLIC_APP_URL` set to its own origin.
