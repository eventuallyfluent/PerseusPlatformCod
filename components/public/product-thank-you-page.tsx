import Link from "next/link";
import type { ProductThankYouPagePayload } from "@/types";

export function ProductThankYouPage({
  payload,
  primaryActionHref,
  primaryActionLabel,
  secondaryActionHref,
  secondaryActionLabel,
}: {
  payload: ProductThankYouPagePayload;
  primaryActionHref: string;
  primaryActionLabel: string;
  secondaryActionHref: string;
  secondaryActionLabel: string;
}) {
  return (
    <div className="min-h-[calc(100svh-5.5rem)] bg-[radial-gradient(circle_at_top,var(--perseus-hero-glow),transparent_20%),linear-gradient(180deg,var(--background-deep),var(--background-deep-soft)_34%,var(--background)_100%)] px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[38px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-panel-strong),var(--surface-panel))] px-8 py-10 text-[var(--text-primary)] shadow-[var(--shadow-panel)]">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--text-secondary)]">{payload.eyebrow}</p>
              <h1 className="text-5xl leading-[0.95] tracking-[-0.05em] text-[var(--text-primary)] lg:text-[4.4rem]">{payload.headline}</h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--text-secondary)]">{payload.body}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={primaryActionHref}
                  className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                >
                  {primaryActionLabel}
                </Link>
                <Link
                  href={secondaryActionHref}
                  className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-panel-strong)]"
                >
                  {secondaryActionLabel}
                </Link>
              </div>
            </div>
            <div className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] p-5">
              <div
                className="h-56 rounded-[24px] bg-[linear-gradient(135deg,#1b0c34,#2e175f)] bg-cover bg-center"
                style={
                  payload.imageUrl
                    ? {
                        backgroundImage: `linear-gradient(180deg, rgba(12,9,24,0.16), rgba(12,9,24,0.38)), url(${payload.imageUrl})`,
                      }
                    : undefined
                }
              />
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]">{payload.summaryLabel}</p>
                <h2 className="text-3xl leading-none tracking-[-0.04em] text-[var(--text-primary)]">{payload.productTitle}</h2>
                {payload.productSubtitle ? <p className="text-sm leading-7 text-[var(--text-secondary)]">{payload.productSubtitle}</p> : null}
                <p className="text-sm font-medium text-[var(--premium)]">{payload.summaryValue}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-[var(--border)] bg-[var(--surface-panel)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-panel)]">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]">
              {payload.productType === "course" ? "What is unlocked now" : "What is included now"}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {payload.items.map((item) => (
                <div key={`${item.title}-${item.subtitle ?? ""}`} className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel-strong)] px-5 py-4">
                  <p className="text-base font-semibold text-[var(--text-primary)]">{item.title}</p>
                  {item.subtitle ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.subtitle}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
