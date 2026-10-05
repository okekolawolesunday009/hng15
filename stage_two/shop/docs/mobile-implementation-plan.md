# Mobile Implementation Plan

## Goal

Build a native Northstar storefront in the existing `apps/mobile` workspace using Expo, React Native, and TypeScript. The app consumes the backend API and shared contracts; it does not access the database or hold server credentials.

## Phases

### 1. Inspect And Prepare

- Review the mobile workspace scaffold and repository instructions.
- Add Expo, navigation, platform configuration, and scripts to the existing workspace package.
- Keep dependency management under the npm workspace root.

### 2. Native App Shell

- Create an app shell with safe-area handling and Shop, Cart, and Account tabs.
- Establish a focused storefront visual system and reusable loading, error, empty, and offline states.

### 3. Catalog

- Add a typed API client using the shared contracts and `EXPO_PUBLIC_BACKEND_URL`.
- Build product listing, category/search filtering, and product-detail views using the backend catalog endpoints.
- Normalize product image URLs against the storefront origin when the backend returns relative paths.

### 4. Guest Cart

- Persist only product IDs and quantities in native local storage.
- Hydrate and mutate through backend cart endpoints; the backend remains authoritative for prices, stock, and availability.
- Preserve cart data on network errors and when checkout is unavailable.

### 5. Native Authentication

- The app signs in with Google using the platform OAuth client and sends the ID token to `POST /api/v1/auth/mobile/google`.
- The backend verifies the token's signature, issuer, audience, and verified email before creating or linking the Google account.
- The backend returns a revocable, opaque 30-day mobile session token. The app stores it using native secure storage and sends it as a bearer token; it never sends a user ID as identity.
- Account and cart endpoints resolve the user from the verified session. Signing out revokes the session.
- Native OAuth client IDs must be explicitly configured in `GOOGLE_MOBILE_CLIENT_IDS`.

### 6. Checkout

- Connect the checkout UI to the backend order endpoint.
- Until a payment provider is configured, show the payment-unavailable result, do not clear the cart, and do not claim an order or payment succeeded.

### 7. Verification

- Run mobile typecheck and tests, and start Expo from the workspace.
- Test on an emulator or device against a running backend.
- Verify catalog and cart flows, native Google sign-in and sign-out, API-unavailable behavior, checkout failure handling, and platform layouts.

## Acceptance Criteria

- `apps/mobile` is a runnable Expo app inside the existing npm workspace.
- Catalog data and cart product details come from the backend, not bundled fixtures or database access in the app.
- Guest cart data survives app restarts and is retained when the API or checkout is unavailable.
- The app authenticates only through a verified native OAuth session and never trusts a caller-provided user ID.
- Checkout does not report an order placed while payment processing is deferred.
