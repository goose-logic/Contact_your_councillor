import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Nav() {
  const session = await auth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-slate-900">
          Contact Your Councillor
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {session ? (
            <>
              <Link href="/dashboard" className="text-slate-700 hover:text-slate-900">
                Dashboard
              </Link>
              <span className="text-slate-400">{session.user.email}</span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="text-slate-700 hover:text-slate-900" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-700 hover:text-slate-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
