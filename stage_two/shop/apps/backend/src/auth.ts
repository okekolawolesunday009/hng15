import "dotenv/config";

import { Auth, type AuthConfig } from "@auth/core";
import Google from "@auth/core/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db/index.ts";
import { accounts, sessions, verificationTokens } from "./db/schema/auth.ts";
import { users } from "./db/schema/users.ts";
import { sendWelcomeEmail } from "./services/email.ts";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;

function getGoogleRedirectProxyUrl() {
  if (!googleRedirectUri) return undefined;

  const redirectUri = new URL(googleRedirectUri);
  const callbackPath = "/api/auth/callback/google";
  if (redirectUri.pathname !== callbackPath || redirectUri.search || redirectUri.hash) {
    throw new Error(`GOOGLE_REDIRECT_URI must be an origin plus ${callbackPath}.`);
  }

  return new URL("/api/auth", redirectUri).toString();
}

const providers = googleClientId && googleClientSecret
  ? [Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectProxyUrl: getGoogleRedirectProxyUrl(),
    })]
  : [];

export const authConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  basePath: "/api/auth",
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await sendWelcomeEmail({ id: user.id, name: user.name, email: user.email });
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        Object.assign(session.user, { id: String(token.id) });
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return new URL(url, baseUrl).toString();

      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch {
        return baseUrl;
      }

      return baseUrl;
    },
  },
} satisfies AuthConfig;

export function handleAuthRequest(request: Request) {
  return Auth(request, authConfig);
}
