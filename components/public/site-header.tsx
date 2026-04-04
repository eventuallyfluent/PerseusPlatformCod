import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

function PerseusMark() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className="h-11 w-11">
      <path d="M32 4 L52 38 H12 Z" fill="var(--perseus-logo-primary)" />
      <path d="M32 22 L58 60 H6 Z" fill="var(--perseus-logo-accent)" opacity="0.9" />
      <path d="M32 10 L46 34 H18 Z" fill="var(--perseus-logo-gold)" opacity="0.8" />
    </svg>
  );
}

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(13,13,26,0.84)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-[var(--foreground)]">
          <PerseusMark />
          <div className="space-y-1">
            <span className="block text-sm font-semibold uppercase tracking-[0.28em] text-[var(--foreground)]">Perseus Arcane Academy</span>
            <span className="block text-[11px] uppercase tracking-[0.34em] text-[var(--foreground-soft)]">Structured magical training</span>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm text-[var(--foreground-soft)] sm:gap-4">
          <Link href="/faq" className="rounded-full px-3 py-2 transition hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]">
            FAQ
          </Link>
          <Link href="/dashboard" className="rounded-full px-3 py-2 transition hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]">
            Dashboard
          </Link>
          {session?.user ? (
            <>
              <span className="hidden rounded-full border border-[var(--border)] bg-[var(--background-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-soft)] lg:inline-flex">
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
              <Button className="px-5 py-2.5">Student login</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
