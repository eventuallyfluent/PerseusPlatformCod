import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(248,245,242,0.84)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-[var(--foreground)]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-white/75 text-sm font-semibold uppercase tracking-[0.2em] shadow-[0_10px_24px_rgba(20,26,45,0.06)]">
            P
          </span>
          <div className="space-y-1">
            <span className="block text-lg uppercase tracking-[0.22em]">Perseus</span>
            <Badge variant="premium" className="hidden sm:inline-flex">
              Course platform
            </Badge>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm text-[var(--foreground-soft)] sm:gap-4">
          <Link href="/faq" className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[var(--foreground)]">
            FAQ
          </Link>
          <Link href="/dashboard" className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[var(--foreground)]">
            Dashboard
          </Link>
          {session?.user ? (
            <>
              <span className="hidden rounded-full border border-[var(--border)] bg-white/72 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-soft)] lg:inline-flex">
                {session.user.name ?? session.user.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="ghost" className="px-4 py-2">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button className="px-5 py-2.5">Sign in</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
