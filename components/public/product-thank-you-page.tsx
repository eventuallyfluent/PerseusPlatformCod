import Link from "next/link";
import type { ProductThankYouPagePayload } from "@/types";
import { PublicSmartImage } from "@/components/public/public-smart-image";

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
    <div className="min-h-[calc(100svh-5.5rem)] overflow-x-hidden bg-[radial-gradient(circle_at_top,var(--perseus-hero-glow),transparent_20%),linear-gradient(180deg,var(--background-deep),var(--background-deep-soft)_34%,var(--background)_100%)] px-5 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-panel-strong),var(--surface-panel))] px-5 py-8 text-[var(--text-primary)] shadow-[var(--shadow-panel)] sm:px-8 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--text-secondary)]">{payload.eyebrow}</p>
              <h1 className="break-words text-4xl leading-[0.98] tracking-[-0.04em] text-[var(--text-primary)] sm:text-5xl lg:text-[4.4rem]">{payload.headline}</h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--text-secondary)]">{payload.body}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={primaryActionHref}
                  className="inline-flex min-h-12 items-center rounded-full bg-[var(--button-primary-background)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--button-primary-shadow)] transition hover:bg-[var(--button-primary-hover)]"
                >
                  {primaryActionLabel}
                </Link>
                <Link
                  href={secondaryActionHref}
                  className="inline-flex min-h-12 items-center rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-panel-strong)]"
                >
                  {secondaryActionLabel}
                </Link>
              </div>
            </div>
            <div className="space-y-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] p-4 sm:p-5">
              <PublicSmartImage
                src={payload.imageUrl}
                alt={`${payload.productTitle} image`}
                sizes="(min-width: 1024px) 36vw, 92vw"
                className="h-56 rounded-[20px]"
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

        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-panel)] p-5 text-[var(--text-primary)] shadow-[var(--shadow-panel)] sm:p-6">
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
