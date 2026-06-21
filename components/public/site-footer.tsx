import Link from "next/link";
import { getHomepageSections } from "@/lib/homepage/get-homepage-sections";
import type { HomepageFooterPayload } from "@/lib/homepage/sections";
import { LEGAL_PAGE_LINKS, resolveLegalLink } from "@/lib/legal/company";
import { ThemeToggle } from "@/components/public/theme-toggle";

export async function SiteFooter() {
  const sections = await getHomepageSections();
  const footerSection = sections.find((section) => section.type === "FOOTER" && section.enabled);

  if (!footerSection) {
    return null;
  }

  const payload = footerSection.payload as HomepageFooterPayload;
  const browseLinks = payload.platformLinks
    .map((link) =>
      link.label === "Courses" && link.href.startsWith("/course/")
        ? { ...link, href: "/courses" }
        : link.label === "Collections"
          ? { ...link, label: "Instructors", href: "/instructors" }
          : link,
    )
    .filter((link, index, items) => items.findIndex((candidate) => candidate.label === link.label && candidate.href === link.href) === index);
  const legalLinks = [...payload.legalLinks, ...LEGAL_PAGE_LINKS, { label: "Withdraw from a contract", href: "/withdraw" }]
    .map((link) => ({
      ...link,
      href: resolveLegalLink(link.label, link.href),
    }))
    .filter((link, index, items) => items.findIndex((candidate) => candidate.label === link.label && candidate.href === link.href) === index);

  return (
    <footer className="perseus-site-footer mt-auto mx-auto w-full max-w-7xl px-6 py-16">
      <div className="perseus-footer-shell rounded-[24px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] px-6 py-7 shadow-[var(--shadow-soft)] sm:px-8 sm:py-8">
        <div className="grid gap-8 border-b border-[var(--border)] pb-8 lg:grid-cols-[1.35fr_0.75fr_0.9fr_1.05fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xl font-semibold uppercase tracking-[0.12em] text-[var(--portal-text)]">{payload.brandTitle}</p>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[var(--accent-lavender)]">{payload.brandSubtitle}</p>
              <p className="max-w-sm text-base leading-7 text-[var(--foreground-soft)]">{payload.brandDescription}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {payload.socialLabels.map((label) => (
                <span
                  key={label}
                  className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--perseus-collection-elevated)] text-sm text-[var(--accent-lavender)]"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--accent-lavender)]">{payload.platformHeading}</p>
            <nav className="flex flex-col gap-2.5 text-base text-[var(--foreground-soft)]">
              {browseLinks.map((link) => (
                <Link key={`${link.label}-${link.href}`} href={link.href} className="transition hover:text-[var(--portal-text)]">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--accent-lavender)]">{payload.legalHeading}</p>
            <div className="flex flex-col gap-2.5 text-base text-[var(--foreground-soft)]">
              {legalLinks.map((link) => (
                <Link key={`${link.label}-${link.href}`} href={link.href} className="transition hover:text-[var(--portal-text)]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--accent-lavender)]">Updates</p>
            <div className="space-y-3">
              <p className="text-base leading-7 text-[var(--foreground-soft)]">New courses, collection releases, and academy notes.</p>
              <form action="/login" className="grid gap-3">
                <label className="sr-only" htmlFor="footer-email">Email address</label>
                <input
                  id="footer-email"
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  className="h-12 rounded-[14px] border border-[var(--border)] bg-[var(--perseus-collection-elevated)] px-4 text-sm text-[var(--portal-text)] placeholder:text-[var(--foreground-soft)] focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--button-primary-background)] px-5 text-sm font-semibold text-white shadow-[var(--button-primary-shadow)] transition hover:bg-[var(--button-primary-hover)]"
                >
                  Join updates
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-sm text-[var(--foreground-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>{payload.bottomLeftText}</p>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <p>{payload.bottomRightText}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
