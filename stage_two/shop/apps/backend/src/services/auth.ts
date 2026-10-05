import { z } from "zod";
import { handleAuthRequest } from "../auth.ts";

export const authSessionSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }),
  authenticated: z.literal(true),
});

export type AuthSession = z.infer<typeof authSessionSchema>;

export function isAuthenticatedSession(value: unknown): value is AuthSession {
  return authSessionSchema.safeParse(value).success;
}

export async function getAuthenticatedSession(cookie: string | null): Promise<AuthSession | null> {
  if (!cookie) return null;

  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
    const response = await handleAuthRequest(new Request(`${backendUrl}/api/auth/session`, {
      headers: { cookie },
    }));
    if (!response.ok) return null;

    const session = await response.json() as unknown;
    const parsed = authSessionSchema.safeParse({ ...session as object, authenticated: true });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
