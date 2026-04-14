import Link from "next/link";
import { Card } from "@/components/ui/card";

type LegalSection = {
  title: string;
  body: string[];
};

export function LegalPage({
  eyebrow,
  title,
  summary,
  sections,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-lavender)]">{eyebrow}</p>
        <h1 className="max-w-4xl text-4xl leading-none tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl">{title}</h1>
        <p className="max-w-3xl text-base leading-8 text-[var(--foreground-soft)]">{summary}</p>
      </div>

      <Card className="space-y-8 p-6">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/privacy" className="rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[var(--surface-panel)]">Privacy</Link>
          <Link href="/terms" className="rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[var(--surface-panel)]">Terms</Link>
          <Link href="/refund-policy" className="rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[var(--surface-panel)]">Refunds</Link>
          <Link href="/fulfillment" className="rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[var(--surface-panel)]">Fulfillment</Link>
          <Link href="/cookie-policy" className="rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[var(--surface-panel)]">Cookies</Link>
          <Link href="/contact" className="rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[var(--surface-panel)]">Contact</Link>
          <Link href="/payment-disclosures" className="rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2 text-[var(--text-primary)] transition hover:bg-[var(--surface-panel)]">Payment disclosures</Link>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">{section.title}</h2>
              <div className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
}
