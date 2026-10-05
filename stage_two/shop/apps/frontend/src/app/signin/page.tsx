import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";
import { getBackendSession, hasBackendGoogleProvider } from "@/lib/backend-auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const session = await getBackendSession();

  if (session?.user) {
    redirect("/");
  }

  const hasGoogleConfig = await hasBackendGoogleProvider();
  const isConfigurationError = params.error === "Configuration";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const callbackUrl = new URL("/", appUrl).toString();
  const googleRedirectUri = new URL("/api/auth/callback/google", appUrl).toString();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6 py-12">
      <div className="w-full rounded-[2rem] border border-[#e9decc] bg-white/80 p-8 shadow-[0_18px_45px_rgba(32,26,18,0.05)]">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Account</p>
        <h1 className="mt-3 font-display text-4xl tracking-[-0.05em] text-slate-900">Welcome back</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Sign in to manage your orders, saved preferences, and storefront details.
        </p>

        {isConfigurationError ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Google OAuth is not configured correctly. Check the Google client ID and secret, and add this redirect URI in Google Cloud Console:
            <div className="mt-2 break-all font-mono text-xs">{googleRedirectUri}</div>
          </div>
        ) : null}

        {hasGoogleConfig ? (
          <div className="mt-8">
            <SignInButton callbackUrl={callbackUrl} />
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Google OAuth is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable sign-in.
          </div>
        )}

        <div className="mt-6 text-center text-sm text-slate-600">
          <span>Need an account? </span>
          <Link href="/" className="font-medium text-slate-900 underline-offset-4 hover:underline">Return home</Link>
        </div>
      </div>
    </main>
  );
}
