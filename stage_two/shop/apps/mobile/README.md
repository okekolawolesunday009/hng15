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

Copy `.env.example` to `.env` in this folder if you do not already have one.
Configure `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` and
`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` with the matching Google OAuth client IDs.
Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` if testing the app in a web browser.
Add the Android and iOS client IDs, comma-separated, to
`GOOGLE_MOBILE_CLIENT_IDS` in `apps/backend/.env`; the backend validates every
Google ID token against that allowlist before issuing a session. Register
`com.northstar.mobile` as the Android package and iOS bundle identifier in
Google Cloud Console. Android OAuth also needs the SHA-1 fingerprint for the
signing key used by your development build. These client IDs are public
configuration, not client secrets.

The default `localhost` URLs work in the iOS simulator. For an Android
emulator, use `http://10.0.2.2:4000` for the backend and
`http://10.0.2.2:3000` for the storefront. A physical device needs the
development computer's LAN IP address in these URLs, with both services
reachable over the same network. Start the backend separately using
`npm run backend:dev` from the workspace root.

Native Google sign-in needs an app build with the Northstar URL scheme and
platform OAuth client IDs. Expo Go does not use the app's native package
identifiers; create an Android development build with
`npm --prefix apps/mobile run android:native`, or an iOS development build on
macOS with `npm --prefix apps/mobile run ios:native`, to test the complete
sign-in flow. Android development builds require Android Studio and an
emulator or connected device. Production backend URLs must use HTTPS.

## Scope and data

- The Shop tab loads live products and categories from the backend, with search,
  category filtering, and product details.
- The guest bag persists only product IDs and quantities in AsyncStorage.
  Prices, stock, and product details are fetched from the backend.
- Native Google sign-in exchanges a verified Google ID token with the backend
  for a revocable mobile session. The session is stored in device secure
  storage, and account/cart requests identify the user from that session.
- Checkout is wired to the backend order endpoint, which currently returns
  `PAYMENT_UNAVAILABLE`. The app keeps the guest bag and does not claim an
  order or payment succeeded.
- API failures remain visible and do not delete the saved guest bag.
