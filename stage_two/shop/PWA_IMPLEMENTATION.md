# PWA Implementation Reference

## Scope

This project is a Next.js 16.3.7 App Router application using React 19 and TypeScript. Its PWA setup uses Next.js manifest support and Serwist's Turbopack integration. PWA packages are development dependencies; no authentication, database, checkout, or API behavior was changed for this feature.

The goal is installability and a safe generic offline navigation fallback, not a fully offline storefront. Product data, prices, inventory, carts, account details, and checkout still require the application server.

## Implementation Map

- `package.json`: `@serwist/turbopack` and `serwist` provide worker integration and runtime; `esbuild` is pinned to the existing 0.25.12 version to avoid changing other esbuild resolutions.
- `next.config.ts`: wraps the config with `withSerwist`, sets `Service-Worker-Allowed: /` so the worker at `/serwist/sw.js` can control the site root, and prevents caching of service-worker files.
- `src/app/serwist/[path]/route.ts`: builds and serves the worker and its source map. It adds revisioned entries for the offline page and core PWA icons.
- `src/app/sw.ts`: filters Serwist's build manifest to same-origin `/_next/static/` assets, `/offline.html`, and `/icons/` only. It provides the offline document only for failed GET navigations.
- `src/app/layout.tsx`: adds app/Apple metadata and theme color and registers the worker with root scope. Registration is disabled outside production; navigation caching is disabled.
- `src/app/manifest.ts`: defines the `/manifest.webmanifest` response, standalone display, app name, colors, scope, and install icons.
- `public/icons/`: contains the 192px, 512px, maskable 512px, and Apple touch PNG icons.
- `public/offline.html`: generic fallback page with no user-specific content or application data.
- `README.md`: links the basic PWA behavior to the normal project setup notes.

## Cache And Security Boundaries

The service worker intentionally has no runtime API cache and does not cache document navigations. The precache allowlist is restricted to same-origin Next static build assets, the offline fallback, and icons. The app's rendered pages are dynamic and the root layout reads the authenticated session, so caching HTML or Next.js navigation/RSC responses could preserve one user's personalized UI in a shared browser.

Keep these requests and data network-only:

- Auth.js endpoints, session data, cookies, and tokens.
- Server Actions, including cart hydration/mutations and checkout actions.
- API responses, account pages, cart pages, checkout pages, and any future user-specific data.
- Any request containing private information or any non-GET/write request.

Do not add background sync or queue checkout/cart writes without a separate design and security review. The offline page is informational only; it does not imply that a cart, order, payment, or email action succeeded. Product/catalog data is also not stored offline, so product availability and prices always come from the online application.

## Installability And HTTPS

The manifest uses `display: "standalone"`, a root `start_url` and `scope`, and PNG icons at 192px and 512px, including a maskable icon. The Apple touch icon is declared through Next metadata. Users need a browser that supports web app installation and must visit a secure context. Production must use HTTPS; browsers generally treat `localhost` as secure for local testing.

No install prompt UI is currently implemented. Browsers may provide their native install affordance when the app meets platform requirements. iOS users generally add the app from Safari's Share menu. This implementation does not include push notifications, VAPID keys, or notification subscriptions.

## Development And Verification

Run commands from `stage_two/shop`:

```powershell
npm ci
npm run dev
```

Service-worker registration is disabled in development to avoid stale caches interfering with hot reload. Test the production worker and installability with:

```powershell
npm run build
npm start
```

Then inspect `/manifest.webmanifest`, `/serwist/sw.js`, `/offline.html`, and the icon URLs in browser developer tools. In an HTTPS-capable test environment, verify the worker's scope is `/`, its response has `Service-Worker-Allowed: /` and `Cache-Control: no-cache, no-store, must-revalidate`, and an offline GET navigation displays only the generic fallback. Confirm API and authenticated requests are not stored in Cache Storage. Clear/unregister the worker between iterations when testing cache behavior.

Project checks:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## Verification Record

- `npm run build` passed after the PWA integration and again after scoping and root-worker updates. Serwist reported 30 precache entries (about 1.16 MiB).
- `npm test` passed all 12 existing unit tests.
- Focused ESLint on the PWA TypeScript files passed, and the changed TypeScript files had no reported editor diagnostics.
- The full `npm run lint` still reports four errors in untouched `src/components/site-footer.tsx` and `src/components/wishlist-button.tsx`.
- An HTTP smoke test returned 200 for the manifest, worker, offline page, and each declared icon. The manifest parsed with three icons. The later root-scope header change was build-verified but was not rechecked over HTTP.
- npm reported 12 audit findings during dependency installation. No audit fixes or unrelated package upgrades were applied.

## Follow-Up Considerations

- Recheck production response headers and root service-worker scope in the target deployment environment.
- Use browser application tools or Lighthouse to verify installability on supported desktop and mobile browsers.
- If offline catalog browsing is ever needed, design it around explicitly public, non-sensitive, versioned catalog data; do not broaden caching to rendered pages or authenticated requests.