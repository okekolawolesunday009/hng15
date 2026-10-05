"use client";

import { useState } from "react";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export function SignInButton({ callbackUrl }: { callbackUrl: string }) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setIsSigningIn(true);
    setError(null);

    try {
      const csrfResponse = await fetch(`${backendUrl}/api/auth/csrf`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!csrfResponse.ok) throw new Error("Unable to start sign in.");

      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const response = await fetch(`${backendUrl}/api/auth/signin/google`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({ csrfToken, callbackUrl }),
      });
      if (!response.ok) throw new Error("Unable to start Google sign in.");

      const result = await response.json() as { url?: string };
      if (!result.url) throw new Error("Google sign in returned no redirect.");
      window.location.assign(result.url);
    } catch {
      setError("Unable to start Google sign in. Please try again.");
      setIsSigningIn(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signIn}
        disabled={isSigningIn}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#171717] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(23,23,23,0.18)] transition hover:bg-[#2d2d2d] disabled:cursor-wait disabled:opacity-60"
      >
        <span className="text-white">{isSigningIn ? "Connecting..." : "Continue with Google"}</span>
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}