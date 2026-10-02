import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
      <div className="rounded-[2rem] border border-[#e9decc] bg-white/80 p-8 shadow-[0_18px_45px_rgba(32,26,18,0.05)]">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">Profile</p>
        <h1 className="mt-3 font-display text-4xl tracking-[-0.05em] text-slate-900">
          Welcome, {session.user.name ?? "friend"}
        </h1>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Name</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">{session.user.name ?? "Not provided"}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Email</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">{session.user.email ?? "Not available"}</p>
          </div>
        </div>

        <form action={handleSignOut} className="mt-8">
          <button type="submit" className="inline-flex rounded-full border border-slate-300 bg-[#f6f2ea] px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-[#efe7db]">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
