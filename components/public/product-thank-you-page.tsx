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
    <div className="min-h-[calc(100svh-5.5rem)] bg-[radial-gradient(circle_at_top,rgba(143,44,255,0.08),transparent_20%),linear-gradient(180deg,#0d0f1d,#13152a_34%,#0c0e1d_100%)] px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[38px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#150a2f,#110a24)] px-8 py-10 text-white shadow-[0_34px_80px_rgba(10,11,24,0.28)]">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[rgba(228,216,255,0.74)]">{payload.eyebrow}</p>
              <h1 className="text-5xl leading-[0.95] tracking-[-0.05em] text-white lg:text-[4.4rem]">{payload.headline}</h1>
              <p className="max-w-2xl text-base leading-8 text-[rgba(236,229,255,0.8)]">{payload.body}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={primaryActionHref}
                  className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                >
                  {primaryActionLabel}
                </Link>
                <Link
                  href={secondaryActionHref}
                  className="inline-flex rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/6"
                >
                  {secondaryActionLabel}
                </Link>
              </div>
            </div>
            <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgba(228,216,255,0.72)]">{payload.summaryLabel}</p>
                <h2 className="text-3xl leading-none tracking-[-0.04em] text-white">{payload.productTitle}</h2>
                {payload.productSubtitle ? <p className="text-sm leading-7 text-[rgba(236,229,255,0.76)]">{payload.productSubtitle}</p> : null}
                <p className="text-sm font-medium text-[rgba(244,210,122,0.94)]">{payload.summaryValue}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)] shadow-[0_20px_40px_rgba(10,11,24,0.22)]">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--portal-muted)]">
              {payload.productType === "course" ? "What is unlocked now" : "What is included now"}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {payload.items.map((item) => (
                <div key={`${item.title}-${item.subtitle ?? ""}`} className="rounded-[24px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-5 py-4">
                  <p className="text-base font-semibold text-white">{item.title}</p>
                  {item.subtitle ? <p className="mt-2 text-sm text-[var(--portal-muted)]">{item.subtitle}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
