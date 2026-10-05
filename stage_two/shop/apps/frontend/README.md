This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Backend API

Catalog, authentication, sessions, and cart persistence are owned by `apps/backend`. Set `NEXT_PUBLIC_BACKEND_URL` in the frontend environment and run the backend separately with `npm run backend:dev` from the workspace root.

### Browser authentication

Browser Auth.js requests and signed-in cart/order requests use same-origin
frontend proxy routes so browsers can retain the session cookie as a
first-party cookie. Set `NEXT_PUBLIC_APP_URL` to the frontend origin and set
the same `NEXT_PUBLIC_APP_URL` in the backend environment. Auth.js uses the
frontend origin for its callback and first-party auth cookies. Set the
backend's `GOOGLE_REDIRECT_URI` to its public `/api/auth/callback/google`
endpoint and register that URI with Google. Auth.js uses that backend endpoint
as a redirect proxy and returns the browser to the frontend callback. For
local development, set it to
`http://localhost:4000/api/auth/callback/google`.

The frontend proxy forwards these requests to `NEXT_PUBLIC_BACKEND_URL`. Native
mobile authentication continues to call the backend directly.

Database schemas, migrations, and external-service credentials belong in `apps/backend`. Run database commands from that package with `npm run db:generate` or `npm run db:migrate`. Payment processing is deferred; checkout currently reports that no order was placed.

## Progressive Web App

The production service worker precaches only Next.js static assets, the app icons, and a generic offline page. It does not cache pages, Auth.js routes, server actions, or API responses. Registration is disabled during development; test service-worker behavior with `npm run build` followed by `npm start`. Production installation requires HTTPS (localhost is treated as a secure context).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
