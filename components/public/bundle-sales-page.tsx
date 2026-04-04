import Link from "next/link";
import { buildBundleProductStructuredData, buildFaqStructuredData } from "@/lib/seo/structured-data";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StreamableEmbed } from "@/components/ui/streamable-embed";
import type { BundleSalesPagePayload, BundleWithRelations } from "@/types";

export function BundleSalesPage({ bundle, payload }: { bundle: BundleWithRelations; payload: BundleSalesPagePayload }) {
  const productJsonLd = buildBundleProductStructuredData(bundle, payload);
  const faqJsonLd = payload.faqs.length > 0 ? buildFaqStructuredData(payload) : null;

  return (
    <div className="px-6 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}

      <div className="space-y-18">
        <section className="mx-auto grid max-w-7xl gap-8 rounded-[40px] border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-8 py-10 shadow-[var(--shadow-soft)] lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-7">
            <div className="flex flex-wrap gap-3">
              <Badge variant="accent">Perseus bundle</Badge>
              <Badge variant="premium">Multiple enrollments</Badge>
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-6xl leading-[0.92] tracking-[-0.05em] text-[var(--foreground)] sm:text-7xl">{payload.hero.title}</h1>
              {payload.hero.subtitle ? <p className="max-w-2xl text-lg leading-9 text-[var(--foreground-soft)]">{payload.hero.subtitle}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              {payload.pricing.map((price) => (
                <Link key={price.offerId} href={price.checkoutUrl}>
                  <Button className="min-w-[260px]">{payload.hero.ctaLabel} - {price.price} {price.currency}</Button>
                </Link>
              ))}
            </div>
          </div>
          <div
            className="min-h-[420px] rounded-[34px] border border-[var(--border)] bg-cover bg-center"
            style={{
              backgroundImage: payload.hero.imageUrl
                ? `linear-gradient(180deg, rgba(15, 16, 32, 0.18), rgba(15, 16, 32, 0.46)), url(${payload.hero.imageUrl})`
                : "linear-gradient(135deg, #1b0c34, #2e175f)",
            }}
          />
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 border-y border-[var(--border)] py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <SectionHeading eyebrow="Bundle overview" title="What this unlocks in one step." />
            {payload.description.shortDescription ? <p className="max-w-2xl text-lg leading-8 text-[var(--foreground-soft)]">{payload.description.shortDescription}</p> : null}
            {payload.description.longDescription ? <p className="max-w-2xl text-base leading-8 text-[var(--foreground-soft)]">{payload.description.longDescription}</p> : null}
          </div>
          <div className="rounded-[30px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)]">
            {payload.video.salesVideoUrl ? (
              <StreamableEmbed url={payload.video.salesVideoUrl} title={`${payload.hero.title} bundle video`} />
            ) : (
              <p className="text-sm text-[var(--muted)]">No bundle video configured.</p>
            )}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          <div className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[var(--shadow-soft)]">
            <Badge variant="accent">Outcomes</Badge>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--foreground-soft)]">
              {payload.outcomes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[var(--shadow-soft)]">
            <Badge variant="premium">Who it is for</Badge>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--foreground-soft)]">
              {payload.audience.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[var(--shadow-soft)]">
            <Badge variant="success">Bundle includes</Badge>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--foreground-soft)]">
              {payload.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-8">
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

        <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[34px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-soft)]">
            <Badge variant="muted">Purchase logic</Badge>
            <h3 className="mt-4 text-4xl leading-none tracking-[-0.04em] text-[var(--foreground)]">One checkout. Multiple course enrollments.</h3>
            <p className="mt-5 text-sm leading-8 text-[var(--foreground-soft)]">
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

        <section className="mx-auto max-w-7xl rounded-[38px] bg-[rgba(19,20,40,0.98)] px-8 py-10 text-white shadow-[0_30px_70px_rgba(18,20,41,0.18)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <Badge variant="premium">Pricing</Badge>
              <h2 className="mt-4 max-w-2xl text-5xl leading-none tracking-[-0.04em]">{payload.finalCta.label}</h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-[#bdb3da]">
                A bundle should feel as clear as a single product: one decisive CTA, one purchase flow, and a clean transition into study.
              </p>
            </div>
            <div className="grid gap-3">
              {payload.pricing.map((price) => (
                <Link
                  key={price.offerId}
                  href={price.checkoutUrl}
                  className="flex items-center justify-between rounded-[24px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.04)] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.1)]"
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
