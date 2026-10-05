import "dotenv/config";

import { Auth, type AuthConfig } from "@auth/core";
import Google from "@auth/core/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db/index.ts";
import { accounts, sessions, verificationTokens } from "./db/schema/auth.ts";
import { users } from "./db/schema/users.ts";
import { sendWelcomeEmail } from "./services/email.ts";

const storefrontUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const providers = googleClientId && googleClientSecret
  ? [Google({ clientId: googleClientId, clientSecret: googleClientSecret })]
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
      if (url.startsWith("/")) return new URL(url, storefrontUrl).toString();

      try {
        if (new URL(url).origin === new URL(storefrontUrl).origin) return url;
      } catch {
        return storefrontUrl;
      }

      return storefrontUrl;
    },
  },
} satisfies AuthConfig;

export function handleAuthRequest(request: Request) {
  return Auth(request, authConfig);
}
