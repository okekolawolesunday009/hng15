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

Run backend commands from this directory. Copy `.env.example` to `.env` and configure database, Auth.js, and Mailgun values here. The frontend only needs `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_APP_URL`.
