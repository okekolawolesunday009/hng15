# Northstar Mobile

The native Northstar storefront is an Expo / React Native app in the npm
workspace. It consumes the backend API and shared TypeScript contracts; it
does not access the database or keep server credentials.

## Run

From `stage_two/shop`, install workspace dependencies once with `npm install`,
then start the native development server:

```powershell
npm --prefix apps/mobile run start
npm --prefix apps/mobile run android
npm --prefix apps/mobile run ios
npm --prefix apps/mobile run typecheck
```

Copy `.env.example` to `.env` in this folder to configure the public backend and
storefront URLs. The defaults work for a local iOS simulator. For an Android
emulator, use `http://10.0.2.2:4000` for the backend and
`http://10.0.2.2:3000` for the storefront. A physical device needs the
development computer's LAN IP address, with both services reachable over the
same network. Start the backend separately using `npm run backend:dev` from the
workspace root.

## Scope and data

- The Shop tab loads live products and categories from the backend, with search,
  category filtering, and product details.
- The guest bag persists only product IDs and quantities in AsyncStorage.
  Prices, stock, and product details are fetched from the backend.
- Sign-in and account-linked carts are intentionally unavailable until the
  backend supports native authentication. The app never sends a user ID as
  identity.
- Checkout is wired to the backend order endpoint, which currently returns
  `PAYMENT_UNAVAILABLE`. The app keeps the guest bag and does not claim an
  order or payment succeeded.
- API failures remain visible and do not delete the saved guest bag.
