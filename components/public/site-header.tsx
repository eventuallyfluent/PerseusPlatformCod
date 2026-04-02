import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(243,238,229,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-stone-950">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[rgba(255,252,247,0.72)] text-sm font-semibold uppercase tracking-[0.2em]">
            P
          </span>
          <span className="text-lg uppercase tracking-[0.24em]">Perseus</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm text-stone-600 sm:gap-5">
          <Link href="/faq" className="rounded-full px-3 py-2 transition hover:bg-white/60 hover:text-stone-950">
            FAQ
          </Link>
          <Link href="/dashboard" className="rounded-full px-3 py-2 transition hover:bg-white/60 hover:text-stone-950">
            Dashboard
          </Link>
          {session?.user ? (
            <>
              <span className="hidden rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600 lg:inline-flex">
                {session.user.name ?? session.user.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="ghost" className="px-3 py-2">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button className="px-4 py-2">Sign in</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
