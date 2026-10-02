This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Shopping Cart

Guest carts are stored in browser local storage as product IDs and quantities only. Product names, prices, and stock are loaded from Neon through server actions. Signed-in carts are stored in the `carts` and `cart_items` tables and are scoped to the authenticated user.

After updating the database schema, apply migrations from this directory with `npm run db:migrate`. Run `npm run typecheck`, `npm run lint`, and `npm run test` to check the cart implementation. No cart-specific environment variables are required.

## Transactional Email

Mailgun is used only for server-side application email. Set `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, and `MAILGUN_FROM_EMAIL` in `.env`; the sender address must be authorized for the configured Mailgun domain. Sandbox domains can deliver only to authorized recipients. The first-user welcome event is recorded in `email_events` under a unique user key to prevent duplicate sends. Apply database migrations before testing it. Order confirmation email is not enabled until a payment provider verifies successful payment server-side.

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
