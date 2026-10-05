import "server-only";

import { headers } from "next/headers";

export type StorefrontSession = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  expires?: string;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

const backendAuthUrl = `${backendUrl}/api/auth`;

export async function getBackendSession(): Promise<StorefrontSession | null> {
  try {
    const requestHeaders = await headers();
    const response = await fetch(`${backendAuthUrl}/session`, {
      headers: { cookie: requestHeaders.get("cookie") ?? "" },
      cache: "no-store",
    });

    if (!response.ok) return null;
    const session = (await response.json()) as StorefrontSession | null;
    return session?.user?.id ? session : null;
  } catch {
    return null;
  }
}

export async function hasBackendGoogleProvider() {
  try {
    const response = await fetch(`${backendAuthUrl}/providers`, { cache: "no-store" });
    if (!response.ok) return false;
    const providers = (await response.json()) as Record<string, unknown>;
    return "google" in providers;
  } catch {
    return false;
  }
}