import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { HardLink } from "@/components/ui/hard-link";

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
    <header className="perseus-site-header sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header-surface)] backdrop-blur-xl">
      <div className="perseus-site-header-inner mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <HardLink href="/" className="perseus-site-brand flex min-w-0 items-center gap-3 text-[var(--text-primary)]">
          <PerseusMark />
          <div className="min-w-0 space-y-1">
            <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-primary)] sm:text-sm sm:tracking-[0.28em]">Perseus Arcane Academy</span>
            <span className="block text-[10px] uppercase tracking-[0.26em] text-[var(--text-secondary)] sm:text-[11px] sm:tracking-[0.34em]">Structured magical training</span>
          </div>
        </HardLink>
        <nav className="perseus-site-nav flex w-full shrink-0 basis-full flex-wrap items-center justify-between gap-2 text-sm text-[var(--text-primary)] sm:w-auto sm:basis-auto sm:justify-start sm:gap-4">
          <HardLink href="/faq" className="rounded-full px-3 py-2 text-[var(--text-primary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]">
            FAQ
          </HardLink>
          <HardLink href="/dashboard" className="rounded-full px-3 py-2 text-[var(--text-primary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]">
            My courses
          </HardLink>
          {session?.user ? (
            <>
              <span className="hidden rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)] lg:inline-flex">
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
            <ButtonLink href="/login" className="px-4 py-2.5 sm:px-5">
              Student login
            </ButtonLink>
          )}
        </nav>
      </div>
    </header>
  );
}
