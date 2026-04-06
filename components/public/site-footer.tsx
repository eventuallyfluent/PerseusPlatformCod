import Link from "next/link";
import { getHomepageSections } from "@/lib/homepage/get-homepage-sections";
import type { HomepageFooterPayload } from "@/lib/homepage/sections";

export async function SiteFooter() {
  const sections = await getHomepageSections();
  const footerSection = sections.find((section) => section.type === "FOOTER" && section.enabled);

  if (!footerSection) {
    return null;
  }

  const payload = footerSection.payload as HomepageFooterPayload;
  const platformLinks = payload.platformLinks.map((link) =>
    link.label === "Courses" && link.href.startsWith("/course/")
      ? { ...link, href: "/courses" }
      : link,
  );

  return (
    <footer className="mt-auto mx-auto w-full max-w-7xl px-6 py-16">
      <div className="rounded-[34px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] px-8 py-8 shadow-[var(--shadow-soft)] sm:px-10 sm:py-10">
        <div className="grid gap-10 border-b border-[var(--border)] pb-10 lg:grid-cols-[1.4fr_0.9fr_0.9fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xl font-semibold uppercase tracking-[0.12em] text-[var(--portal-text)]">{payload.brandTitle}</p>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[var(--accent-lavender)]">{payload.brandSubtitle}</p>
              <p className="max-w-sm text-lg leading-8 text-[var(--foreground-soft)]">{payload.brandDescription}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {payload.socialLabels.map((label) => (
                <span
                  key={label}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--perseus-collection-elevated)] text-sm text-[var(--accent-lavender)]"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--accent-lavender)]">{payload.platformHeading}</p>
            <nav className="flex flex-col gap-3 text-lg text-[var(--foreground-soft)]">
              {platformLinks.map((link) => (
                <Link key={`${link.label}-${link.href}`} href={link.href} className="transition hover:text-[var(--portal-text)]">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--accent-lavender)]">{payload.legalHeading}</p>
            <div className="flex flex-col gap-3 text-lg text-[var(--foreground-soft)]">
              {payload.legalLinks.map((link) => (
                <Link key={`${link.label}-${link.href}`} href={link.href} className="transition hover:text-[var(--portal-text)]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-sm text-[var(--foreground-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>{payload.bottomLeftText}</p>
          <p>{payload.bottomRightText}</p>
        </div>
      </div>
    </footer>
  );
}
