import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StreamableEmbed } from "@/components/ui/streamable-embed";
import type { BundleSalesPagePayload, GeneratedSalesPagePayload, SalesPageOfferSummary, SalesPageSectionKey } from "@/types";

type ProductPayload = GeneratedSalesPagePayload | BundleSalesPagePayload;

function OfferButtons({ offers, primaryLabel }: { offers: SalesPageOfferSummary[]; primaryLabel: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      {offers.map((offer) => (
        <Link key={offer.offerId} href={offer.checkoutUrl}>
          <Button className="min-w-[260px]">
            {primaryLabel} - {offer.price}
          </Button>
        </Link>
      ))}
    </div>
  );
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string | null }) {
  return (
    <div className="max-w-3xl space-y-4">
      <Badge variant="accent">{eyebrow}</Badge>
      <h2 className="text-5xl leading-none tracking-[-0.05em] text-[var(--foreground)]">{title}</h2>
      {body ? <p className="text-lg leading-8 text-[var(--foreground-soft)]">{body}</p> : null}
    </div>
  );
}

export function RenderProductSalesPage({ payload }: { payload: ProductPayload }) {
  const hidden = new Set(payload.sections.hidden);
  const orderedSections = payload.sections.order.filter((section) => !hidden.has(section));

  const renderSection = (section: SalesPageSectionKey) => {
    if (section === "description") {
      return (
        <section key={section} className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionIntro
            eyebrow={payload.descriptionSection.eyebrow}
            title={payload.descriptionSection.title}
            body={payload.descriptionSection.shortDescription}
          />
          <div className="space-y-5 rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[var(--shadow-soft)]">
            {payload.media.salesVideoUrl ? (
              <StreamableEmbed url={payload.media.salesVideoUrl} title={`${payload.hero.title} sales video`} />
            ) : (
              <p className="text-sm text-[var(--muted)]">No sales video configured.</p>
            )}
            {payload.descriptionSection.longDescription ? (
              <p className="text-sm leading-8 text-[var(--foreground-soft)]">{payload.descriptionSection.longDescription}</p>
            ) : null}
          </div>
        </section>
      );
    }

    if (section === "highlights") {
      return (
        <section key={section} className="mx-auto max-w-7xl space-y-8 px-6">
          <SectionIntro eyebrow={payload.highlightsSection.eyebrow} title="The core promise at a glance." />
          <div className="grid gap-4 lg:grid-cols-3">
            {payload.highlightsSection.cards.map((card) => (
              <div key={card.id} className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] p-6 shadow-[var(--shadow-soft)]">
                <Badge variant={card.id === "audience" ? "premium" : card.id === "includes" ? "success" : "accent"}>{card.title}</Badge>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-[var(--foreground-soft)]">
                  {card.items.length > 0 ? card.items.map((item) => <li key={item}>{item}</li>) : <li>Nothing listed yet.</li>}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (section === "curriculum" && payload.productType === "course") {
      return (
        <section key={section} id="curriculum" className="mx-auto max-w-7xl space-y-8 px-6">
          <SectionIntro eyebrow={payload.curriculumSection.eyebrow} title={payload.curriculumSection.title} />
          <div className="grid gap-5">
            {payload.curriculumSection.modules.map((module, index) => (
              <div key={module.moduleTitle} className="grid gap-5 rounded-[34px] border border-[var(--border)] bg-[rgba(21,18,40,0.97)] p-6 text-white shadow-[0_24px_60px_rgba(18,20,41,0.12)] lg:grid-cols-[0.34fr_1fr]">
                <div className="space-y-3">
                  <Badge variant="portal">Module {index + 1}</Badge>
                  <h3 className="text-3xl leading-none tracking-[-0.03em]">{module.moduleTitle}</h3>
                </div>
                <ul className="grid gap-3">
                  {module.lessons.map((lesson) => (
                    <li key={lesson.title} className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm text-[#ddd5f5]">
                      <span>{lesson.title}</span>
                      <Badge variant={lesson.isPreview ? "premium" : "portal"}>{lesson.isPreview ? "Preview" : "Included"}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (section === "included-courses" && payload.productType === "bundle") {
      return (
        <section key={section} id="included-courses" className="mx-auto max-w-7xl space-y-8 px-6">
          <SectionIntro eyebrow={payload.includedCoursesSection.eyebrow} title={payload.includedCoursesSection.title} body={payload.includedCoursesSection.body} />
          <div className="grid gap-4 md:grid-cols-2">
            {payload.includedCoursesSection.courses.map((course, index) => (
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
      );
    }

    if (section === "instructor" && payload.productType === "course") {
      return (
        <section key={section} className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[34px] border border-[var(--border)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[var(--shadow-soft)]">
              <Badge variant="muted">{payload.instructorSection.eyebrow}</Badge>
              <h3 className="mt-4 text-4xl leading-none tracking-[-0.04em] text-[var(--foreground)]">{payload.instructorSection.name}</h3>
              {payload.instructorSection.imageUrl ? (
                <div
                  className="mt-5 h-72 rounded-[28px] bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(180deg, rgba(22,12,45,0.08), rgba(22,12,45,0.24)), url(${payload.instructorSection.imageUrl})` }}
                />
              ) : null}
              {payload.instructorSection.shortBio ? <p className="mt-5 text-sm leading-8 text-[var(--foreground-soft)]">{payload.instructorSection.shortBio}</p> : null}
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--foreground-soft)]">
                {payload.instructorSection.socialLinks.map((social) => (
                  <a key={social.label} href={social.url} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--border)] px-4 py-2 transition hover:bg-white/80">
                    {social.label}
                  </a>
                ))}
              </div>
              <Link href={payload.instructorSection.pageUrl} className="mt-6 inline-flex text-sm font-semibold text-[var(--foreground)] underline underline-offset-4">
                View instructor page
              </Link>
            </div>
            <div className="flex items-end rounded-[34px] border border-[var(--border)] bg-[rgba(19,20,40,0.98)] p-8 text-white shadow-[0_30px_70px_rgba(18,20,41,0.18)]">
              <div>
                <Badge variant="premium">{payload.instructorSection.eyebrow}</Badge>
                <h3 className="mt-4 text-4xl leading-none tracking-[-0.04em]">{payload.instructorSection.title}</h3>
                <p className="mt-5 text-base leading-8 text-[#bdb3da]">
                  The sales page should make the teacher legible and credible without breaking the structured product flow.
                </p>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (section === "testimonials") {
      return (
        <section key={section} className="mx-auto max-w-7xl space-y-8 px-6">
          <SectionIntro eyebrow={payload.testimonialsSection.eyebrow} title={payload.testimonialsSection.title} />
          <div className="grid gap-4 lg:grid-cols-3">
            {payload.testimonialsSection.items.map((testimonial, index) => (
              <blockquote key={`${testimonial.quote}-${index}`} className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[var(--shadow-soft)]">
                <p className="text-lg leading-8 text-[var(--foreground-soft)]">&ldquo;{testimonial.quote}&rdquo;</p>
                {testimonial.name ? <footer className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{testimonial.name}</footer> : null}
                {testimonial.source ? <p className="mt-1 text-sm text-[var(--muted)]">{testimonial.source}</p> : null}
              </blockquote>
            ))}
          </div>
        </section>
      );
    }

    if (section === "faqs") {
      return (
        <section key={section} className="mx-auto max-w-7xl space-y-8 px-6">
          <SectionIntro eyebrow={payload.faqSection.eyebrow} title={payload.faqSection.title} />
          <div className="grid gap-4">
            {payload.faqSection.items.map((faq) => (
              <div key={faq.question} className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[var(--shadow-soft)]">
                <h3 className="text-xl leading-none tracking-[-0.02em] text-[var(--foreground)]">{faq.question}</h3>
                <p className="mt-3 text-sm leading-8 text-[var(--foreground-soft)]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (section === "pricing") {
      return (
        <section key={section} className="mx-auto max-w-7xl px-6">
          <div className="rounded-[38px] bg-[rgba(19,20,40,0.98)] px-8 py-10 text-white shadow-[0_34px_70px_rgba(18,20,41,0.18)]">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
              <div>
                <Badge variant="premium">{payload.pricingSection.badge}</Badge>
                <h2 className="mt-4 max-w-2xl text-5xl leading-none tracking-[-0.05em]">{payload.pricingSection.headline}</h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-[#bdb3da]">{payload.pricingSection.body}</p>
              </div>
              <div className="grid gap-3">
                {payload.pricingSection.offers.map((offer) => (
                  <Link
                    key={offer.offerId}
                    href={offer.checkoutUrl}
                    className="rounded-[24px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-white transition hover:bg-[rgba(255,255,255,0.08)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{offer.name}</span>
                      <span className="text-sm font-semibold">{offer.price}</span>
                    </div>
                    {offer.compareAtPrice || offer.savingsLabel ? (
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-[#bdb3da]">
                        <span>{offer.compareAtPrice ?? ""}</span>
                        <span>{offer.savingsLabel ?? ""}</span>
                      </div>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--portal-border)] pt-8">
              <div className="max-w-2xl">
                <h3 className="text-4xl leading-none tracking-[-0.04em]">{payload.finalCta.label}</h3>
                <p className="mt-4 text-base leading-8 text-[#bdb3da]">{payload.finalCta.body}</p>
              </div>
              <OfferButtons offers={payload.pricingSection.offers} primaryLabel={payload.hero.primaryCtaLabel} />
            </div>
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div className="space-y-20">
      <section className="relative overflow-hidden px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(143,44,255,0.13),transparent_24%),radial-gradient(circle_at_70%_30%,rgba(212,168,70,0.12),transparent_22%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 rounded-[40px] border border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-8 py-10 shadow-[var(--shadow-soft)] lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:px-12 lg:py-12">
          <div className="space-y-7">
            <div className="flex flex-wrap gap-3">
              <Badge variant="accent">{payload.hero.eyebrow}</Badge>
              {payload.hero.primaryOffer?.savingsLabel ? <Badge variant="premium">{payload.hero.primaryOffer.savingsLabel}</Badge> : null}
            </div>
            <div className="space-y-5">
              {payload.hero.metadataLine ? <p className="text-[11px] font-semibold uppercase tracking-[0.36em] text-[var(--muted)]">{payload.hero.metadataLine}</p> : null}
              <h1 className="max-w-4xl text-6xl leading-[0.9] tracking-[-0.06em] text-[var(--foreground)] sm:text-7xl lg:text-[5.5rem]">{payload.hero.title}</h1>
              {payload.hero.subtitle ? <p className="max-w-2xl text-xl leading-9 text-[var(--foreground-soft)]">{payload.hero.subtitle}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={payload.hero.primaryCtaHref}>
                <Button className="min-w-[260px]">{payload.hero.primaryCtaLabel}</Button>
              </Link>
              <a href={payload.hero.secondaryCtaHref}>
                <Button variant="secondary" className="min-w-[220px]">
                  {payload.hero.secondaryCtaLabel}
                </Button>
              </a>
            </div>
          </div>
          <div className="space-y-5">
            <div
              className="min-h-[520px] rounded-[34px] border border-[rgba(88,97,130,0.12)] bg-cover bg-center"
              style={{
                backgroundImage: payload.hero.imageUrl
                  ? `linear-gradient(180deg, rgba(22, 12, 45, 0.18), rgba(22, 12, 45, 0.46)), url(${payload.hero.imageUrl})`
                  : "linear-gradient(135deg, #1b0c34, #2e175f)",
              }}
            />
            {payload.hero.primaryOffer ? (
              <div className="rounded-[28px] bg-[rgba(24,25,47,0.96)] px-6 py-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-[#b7abd9]">Pricing</p>
                    <div className="mt-2 flex items-end gap-3">
                      <p className="text-4xl font-semibold">{payload.hero.primaryOffer.price}</p>
                      {payload.hero.primaryOffer.compareAtPrice ? <p className="text-lg text-[#9a90bd] line-through">{payload.hero.primaryOffer.compareAtPrice}</p> : null}
                    </div>
                  </div>
                  {payload.hero.primaryOffer.savingsLabel ? <Badge variant="premium">{payload.hero.primaryOffer.savingsLabel}</Badge> : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {orderedSections.map((section) => renderSection(section))}
    </div>
  );
}
