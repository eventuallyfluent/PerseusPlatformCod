import type { PropsWithChildren } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <aside className="mx-auto w-full max-w-7xl px-6 pt-8" aria-label="Contract withdrawal">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--surface-panel-strong)] px-5 py-4">
          <p className="text-sm text-[var(--foreground-soft)]">Need to exercise a right of withdrawal for an online purchase?</p>
          <Link href="/withdraw" className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-panel)]">
            Withdraw from a contract
          </Link>
        </div>
      </aside>
      <SiteFooter />
    </div>
  );
}
