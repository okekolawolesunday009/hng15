"use client";

import { useState } from "react";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setIsSigningOut(true);
    setError(null);

    try {
      const csrfResponse = await fetch(`${backendUrl}/api/auth/csrf`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!csrfResponse.ok) throw new Error("Unable to start sign out.");

      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch(`${backendUrl}/api/auth/signout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({
          csrfToken,
          callbackUrl: `${window.location.origin}/`,
        }),
      });
      if (!response.ok) throw new Error("Unable to sign out.");

      const result = await response.json() as { url?: string };
      window.location.assign(result.url ?? "/");
    } catch {
      setError("Unable to sign out. Please try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signOut}
        disabled={isSigningOut}
        className="inline-flex rounded-full border border-slate-300 bg-[#f6f2ea] px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-[#efe7db] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}