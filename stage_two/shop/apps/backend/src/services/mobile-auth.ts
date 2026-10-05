import { createHash, randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { and, eq, gt, sql } from "drizzle-orm";
import type { MobileAuthData, UserSummary } from "@northstar/shared";
import { getBackendEnvironment } from "../config/env.ts";
import { db } from "../db/index.ts";
import { accounts, sessions } from "../db/schema/auth.ts";
import { users } from "../db/schema/users.ts";
import { sendWelcomeEmail } from "./email.ts";

const MOBILE_SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const GOOGLE_PROVIDER = "google";
const googleClient = new OAuth2Client();

export class MobileAuthError extends Error {
  readonly status: number;
  readonly code: "BAD_REQUEST" | "UNAUTHORIZED" | "AUTH_UNAVAILABLE" | "INTERNAL_ERROR";

  constructor(
    message: string,
    status: number,
    code: "BAD_REQUEST" | "UNAUTHORIZED" | "AUTH_UNAVAILABLE" | "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "MobileAuthError";
    this.status = status;
    this.code = code;
  }
}

type VerifiedGoogleUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function userSummary(user: VerifiedGoogleUser): UserSummary {
  return { id: user.id, name: user.name, email: user.email };
}

async function verifyGoogleIdentity(idToken: string): Promise<VerifiedGoogleUser> {
  const { googleMobileClientIds } = getBackendEnvironment();
  if (googleMobileClientIds.length === 0) {
    throw new MobileAuthError(
      "Native Google sign-in is not configured on the backend.",
      503,
      "AUTH_UNAVAILABLE",
    );
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleMobileClientIds,
    });
    payload = ticket.getPayload();
  } catch {
    throw new MobileAuthError("Google sign-in could not be verified. Please try again.", 401, "UNAUTHORIZED");
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new MobileAuthError(
      "Google must provide a verified email address to sign in.",
      401,
      "UNAUTHORIZED",
    );
  }

  return {
    id: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: payload.name?.trim() || null,
    image: payload.picture ?? null,
  };
}

async function findOrCreateGoogleUser(googleUser: VerifiedGoogleUser) {
  return db.transaction(async (tx) => {
    const [linkedAccount] = await tx
      .select({ user: users })
      .from(accounts)
      .innerJoin(users, eq(accounts.userId, users.id))
      .where(and(
        eq(accounts.provider, GOOGLE_PROVIDER),
        eq(accounts.providerAccountId, googleUser.id),
      ))
      .limit(1);

    if (linkedAccount) {
      return { user: userSummary(linkedAccount.user), isNewUser: false };
    }

    let [user] = await tx
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${googleUser.email}`)
      .limit(1);

    if (user && !user.emailVerified) {
      throw new MobileAuthError(
        "This email already belongs to an account without a verified address. Sign in with the existing provider first.",
        409,
        "BAD_REQUEST",
      );
    }

    let isNewUser = false;
    if (!user) {
      const [created] = await tx
        .insert(users)
        .values({
          email: googleUser.email,
          emailVerified: new Date(),
          name: googleUser.name,
          image: googleUser.image,
        })
        .onConflictDoNothing({ target: users.email })
        .returning();
      isNewUser = Boolean(created);
      user = created ?? await tx
        .select()
        .from(users)
        .where(sql`lower(${users.email}) = ${googleUser.email}`)
        .then((rows) => rows[0]);

      if (!user) throw new Error("Unable to create or find the Google account.");
      if (!user.emailVerified) {
        throw new MobileAuthError(
          "This email already belongs to an account without a verified address. Sign in with the existing provider first.",
          409,
          "BAD_REQUEST",
        );
      }
    }

    await tx.insert(accounts).values({
      userId: user.id,
      type: "oidc",
      provider: GOOGLE_PROVIDER,
      providerAccountId: googleUser.id,
    }).onConflictDoNothing();

    const [accountOwner] = await tx
      .select({ userId: accounts.userId })
      .from(accounts)
      .where(and(
        eq(accounts.provider, GOOGLE_PROVIDER),
        eq(accounts.providerAccountId, googleUser.id),
      ))
      .limit(1);

    if (accountOwner?.userId !== user.id) {
      throw new MobileAuthError("This Google account is already linked to another user.", 409, "BAD_REQUEST");
    }

    return { user: userSummary(user), isNewUser };
  });
}

export async function exchangeGoogleIdToken(idToken: unknown): Promise<MobileAuthData> {
  if (typeof idToken !== "string" || idToken.length < 20 || idToken.length > 8192) {
    throw new MobileAuthError("A valid Google ID token is required.", 400, "BAD_REQUEST");
  }

  const identity = await verifyGoogleIdentity(idToken);
  const { user, isNewUser } = await findOrCreateGoogleUser(identity);
  if (isNewUser) {
    await sendWelcomeEmail({ id: user.id, name: user.name, email: user.email });
  }
  const accessToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MOBILE_SESSION_LIFETIME_MS);

  await db.insert(sessions).values({
    sessionToken: hashSessionToken(accessToken),
    userId: user.id,
    expires: expiresAt,
  });

  return { accessToken, expiresAt: expiresAt.toISOString(), user };
}

export async function getMobileSession(authorization: string | undefined) {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length);
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(token)) return null;

  const [session] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(
      eq(sessions.sessionToken, hashSessionToken(token)),
      gt(sessions.expires, new Date()),
    ))
    .limit(1);

  return session
    ? { user: { id: session.id, name: session.name, email: session.email }, authenticated: true as const }
    : null;
}

export async function revokeMobileSession(authorization: string | undefined) {
  if (!authorization?.startsWith("Bearer ")) return;
  const token = authorization.slice("Bearer ".length);
  if (!/^[A-Za-z0-9_-]{40,128}$/.test(token)) return;
  await db.delete(sessions).where(eq(sessions.sessionToken, hashSessionToken(token)));
}
