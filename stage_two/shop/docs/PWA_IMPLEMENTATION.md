# PWA Implementation Reference

## Scope

The frontend is a Next.js 16.3.7 App Router application using React 19, TypeScript, and Serwist's Turbopack integration. The PWA provides install metadata and a generic offline navigation fallback; it does not promise offline catalog, cart, account, or checkout behavior.

## Implementation Map

- `apps/frontend/package.json`: `@serwist/turbopack` and `serwist` provide worker integration; `esbuild` is pinned to the existing version.
- `apps/frontend/next.config.ts`: configures Serwist, root worker scope, and no-cache headers for service-worker files.
- `apps/frontend/src/app/serwist/[path]/route.ts`: serves the worker and source map.
- `apps/frontend/src/app/sw.ts`: allowlists same-origin Next static assets, `/offline.html`, and PWA icons; only failed GET navigations receive the offline fallback.
- `apps/frontend/src/app/layout.tsx`: supplies app/Apple metadata and registers the worker with root scope. Registration is disabled outside production and navigation caching is off.
- `apps/frontend/src/app/manifest.ts`: defines the standalone manifest, app name, colors, scope, and install icons.
- `apps/frontend/public/icons/`: contains 192px, 512px, maskable 512px, and Apple touch icons.
- `apps/frontend/public/offline.html`: generic fallback with no user-specific content.

## Cache And Security Boundaries

The service worker has no runtime API cache and does not cache document navigations. Its precache is restricted to same-origin Next static assets, the offline page, and icons. Rendered pages may contain session-specific UI; caching HTML, RSC navigation responses, or authenticated requests could expose one user's information in a shared browser.

Keep these network-only:

- Backend Auth.js endpoints under `/api/auth`, including session, CSRF, cookies, and OAuth.
- Backend API responses under `/api/v1`, including catalog, user, cart, and checkout data.
- Account, cart, checkout, and any future user-specific data.
- Any request containing private information or any write request.

Do not add background sync or queue cart/checkout writes without a separate security review. The offline page is informational; it does not imply that a cart, order, payment, or email action succeeded. Product availability and prices come from the online backend.

## Installability

The manifest uses standalone display, a root start URL and scope, and PNG icons at 192px and 512px, including a maskable icon. The Apple touch icon is declared through Next metadata. Production requires HTTPS; localhost is generally treated as a secure context. There is no custom install prompt, push notification, or VAPID integration.

## Development And Verification

Run commands from the workspace root:

```powershell
npm run backend:dev
npm run dev
```

Service-worker registration is disabled during development. Test production behavior with:

```powershell
npm run build
npm start
```

Inspect `/manifest.webmanifest`, `/serwist/sw.js`, `/offline.html`, and icon URLs. In an HTTPS-capable environment, verify root worker scope and response headers, then confirm API and authenticated requests are absent from Cache Storage. Clear or unregister the worker between iterations.

## Current Verification

- `npm run build` passed after the frontend transfer; Serwist generated 31 precache entries (about 1.16 MiB).
- Frontend `/`, `/products`, and `/signin` returned HTTP 200 with rendered Northstar content.
- Backend catalog returned database-backed products/categories; guest cart routes worked; unauthenticated user lookup returned 401.
- `npm test` passed all 12 unit tests.
- Backend and shared-contract typechecks passed.
- Full frontend lint still reports four existing issues in untouched `site-footer.tsx` and `wishlist-button.tsx`.
- Checkout returns a payment-unavailable response until a payment provider is configured; it does not clear the cart or claim an order was placed.
