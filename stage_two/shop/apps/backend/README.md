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

Run backend commands from this directory. Copy `.env.example` to `.env` and configure database, Auth.js, and Mailgun values here. Set `GOOGLE_REDIRECT_URI` to the backend's public callback URL, such as `https://test.arika.com.ng/api/auth/callback/google`, and register that exact URI with Google. Auth.js uses the backend callback as its redirect proxy, then returns the browser to the frontend callback so the PKCE cookie remains first-party. Set `NEXT_PUBLIC_APP_URL` to the frontend origin; it is used to validate forwarded storefront requests. The frontend proxy forwards its own host and protocol for Auth.js requests. For native Google sign-in, set `GOOGLE_MOBILE_CLIENT_IDS` to a comma-separated allowlist of the Android and iOS OAuth client IDs configured in `apps/mobile/.env`. The app does not send Google client secrets to the backend exchange endpoint or include them in the mobile bundle. The frontend needs `NEXT_PUBLIC_BACKEND_URL` set to the backend origin and `NEXT_PUBLIC_APP_URL` set to its own origin.
