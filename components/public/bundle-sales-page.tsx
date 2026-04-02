import Link from "next/link";
import { buildBundleProductStructuredData, buildFaqStructuredData } from "@/lib/seo/structured-data";
import { SectionHeading } from "@/components/ui/section-heading";
import { StreamableEmbed } from "@/components/ui/streamable-embed";
import type { BundleSalesPagePayload, BundleWithRelations } from "@/types";

export function BundleSalesPage({ bundle, payload }: { bundle: BundleWithRelations; payload: BundleSalesPagePayload }) {
  const productJsonLd = buildBundleProductStructuredData(bundle, payload);
  const faqJsonLd = payload.faqs.length > 0 ? buildFaqStructuredData(payload) : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}

      <div className="space-y-18">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-stone-500">Perseus bundle</p>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-6xl leading-[0.95] tracking-[-0.05em] text-stone-950 sm:text-7xl">{payload.hero.title}</h1>
              {payload.hero.subtitle ? <p className="max-w-2xl text-lg leading-8 text-stone-600">{payload.hero.subtitle}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              {payload.pricing.map((price) => (
                <Link
                  key={price.offerId}
                  href={price.checkoutUrl}
                  className="rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
                >
                  {payload.hero.ctaLabel} - {price.price} {price.currency}
                </Link>
              ))}
            </div>
          </div>
          <div
            className="min-h-[420px] rounded-[34px] border border-[var(--border)] bg-cover bg-center shadow-[var(--shadow-soft)]"
            style={{
              backgroundImage: payload.hero.imageUrl
                ? `linear-gradient(180deg, rgba(15, 13, 11, 0.12), rgba(15, 13, 11, 0.5)), url(${payload.hero.imageUrl})`
                : "linear-gradient(135deg, #1c1917, #d8ab56)",
            }}
          />
        </section>

        <section className="grid gap-10 border-y border-[var(--border)] py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <SectionHeading eyebrow="Bundle overview" title="What this unlocks in one step." />
            {payload.description.shortDescription ? <p className="max-w-2xl text-lg leading-8 text-stone-700">{payload.description.shortDescription}</p> : null}
            {payload.description.longDescription ? <p className="max-w-2xl text-base leading-8 text-stone-600">{payload.description.longDescription}</p> : null}
          </div>
          <div className="rounded-[30px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)]">
            {payload.video.salesVideoUrl ? (
              <StreamableEmbed url={payload.video.salesVideoUrl} title={`${payload.hero.title} bundle video`} />
            ) : (
              <p className="text-sm text-stone-500">No bundle video configured.</p>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Outcomes</p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-stone-600">
              {payload.outcomes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Who it is for</p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-stone-600">
              {payload.audience.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,252,247,0.68)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Bundle includes</p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-stone-600">
              {payload.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-8">
          <SectionHeading
            eyebrow="Included courses"
            title="Each course stays distinct. The purchase path becomes simpler."
            body="Buy once, then enter each included course through the normal learner dashboard and lesson flow."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {payload.includedCourses.map((course, index) => (
              <div key={course.courseUrl} className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">Included course {index + 1}</p>
                <h3 className="mt-4 text-3xl leading-none tracking-[-0.03em] text-stone-950">{course.title}</h3>
                {course.subtitle ? <p className="mt-3 text-sm leading-7 text-stone-600">{course.subtitle}</p> : null}
                {course.instructorName ? <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">{course.instructorName}</p> : null}
                <Link href={course.courseUrl} className="mt-5 inline-flex text-sm font-semibold text-stone-950 underline underline-offset-4">
                  View course details
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[34px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Purchase logic</p>
            <h3 className="mt-4 text-4xl leading-none tracking-[-0.04em] text-stone-950">One checkout. Multiple course enrollments.</h3>
            <p className="mt-5 text-sm leading-8 text-stone-600">
              Bundle purchases keep commerce simple while preserving the same learner model underneath. Every included course unlocks as a normal enrollment.
            </p>
          </div>
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Testimonials</p>
              <div className="grid gap-4">
                {payload.testimonials.map((testimonial, index) => (
                  <blockquote key={`${testimonial.quote}-${index}`} className="rounded-[30px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]">
                    <p className="text-lg leading-8 text-stone-700">&ldquo;{testimonial.quote}&rdquo;</p>
                    {testimonial.name ? <footer className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">{testimonial.name}</footer> : null}
                  </blockquote>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">FAQ</p>
              <div className="grid gap-4">
                {payload.faqs.map((faq) => (
                  <div key={faq.question} className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,252,247,0.74)] p-6 shadow-[var(--shadow-soft)]">
                    <h3 className="text-xl leading-none tracking-[-0.02em] text-stone-950">{faq.question}</h3>
                    <p className="mt-3 text-sm leading-8 text-stone-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[38px] border border-[var(--border)] bg-[linear-gradient(135deg,#1b1714,#3a2b1d)] px-8 py-10 text-stone-50 shadow-[0_30px_70px_rgba(23,20,18,0.18)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-[11px] uppercase tracking-[0.36em] text-[rgba(255,237,208,0.68)]">Pricing</p>
              <h2 className="mt-4 max-w-2xl text-5xl leading-none tracking-[-0.04em]">{payload.finalCta.label}</h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-[rgba(255,245,232,0.76)]">
                A bundle should feel as clear as a single product: one decisive CTA, one purchase flow, and a clean transition into study.
              </p>
            </div>
            <div className="grid gap-3">
              {payload.pricing.map((price) => (
                <Link
                  key={price.offerId}
                  href={price.checkoutUrl}
                  className="flex items-center justify-between rounded-[24px] border border-[rgba(255,245,232,0.14)] bg-[rgba(255,255,255,0.06)] px-5 py-4 text-sm font-semibold text-stone-50 transition hover:bg-[rgba(255,255,255,0.1)]"
                >
                  <span>{price.currency}</span>
                  <span>{price.price}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
