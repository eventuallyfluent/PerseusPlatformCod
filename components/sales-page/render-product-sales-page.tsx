import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StreamableEmbed } from "@/components/ui/streamable-embed";
import type { BundleSalesPagePayload, GeneratedSalesPagePayload, SalesPageOfferSummary, SalesPageSectionKey } from "@/types";

type ProductPayload = GeneratedSalesPagePayload | BundleSalesPagePayload;

function RatingStars({ rating }: { rating: number }) {
  return (
    <div aria-label={`${rating} star rating`} className="flex gap-1 text-lg leading-none text-[#ffc247]">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index}>{index < rating ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

function OfferButtons({ offers, primaryLabel }: { offers: SalesPageOfferSummary[]; primaryLabel: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      {offers.map((offer) => (
        <Link key={offer.offerId} href={offer.checkoutUrl}>
          <Button className="min-w-[240px] bg-[linear-gradient(135deg,var(--accent),#c16bff)] px-6 shadow-[0_18px_34px_rgba(143,44,255,0.24)]">
            {primaryLabel} {offer.price}
          </Button>
        </Link>
      ))}
    </div>
  );
}

function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string | null }) {
  return (
    <div className="mx-auto max-w-3xl space-y-3 text-center">
      <div className="flex justify-center">
        <Badge variant="accent">{eyebrow}</Badge>
      </div>
      <h2 className="text-4xl leading-none tracking-[-0.045em] text-[var(--foreground)] lg:text-[3.1rem]">{title}</h2>
      {body ? <p className="text-base leading-8 text-[#d2c6ee]">{body}</p> : null}
    </div>
  );
}

export function RenderProductSalesPage({ payload, reviewSlot }: { payload: ProductPayload; reviewSlot?: ReactNode }) {
  const hidden = new Set(payload.sections.hidden);
  const orderedSections = payload.sections.order.filter((section) => !hidden.has(section));

  const renderSection = (section: SalesPageSectionKey) => {
    if (section === "description") {
      return (
        <section key={section} className="mx-auto max-w-7xl space-y-8 px-6">
          <SectionIntro
            eyebrow={payload.descriptionSection.eyebrow}
            title={payload.descriptionSection.title}
            body={payload.descriptionSection.shortDescription}
          />
          <div className="mx-auto max-w-4xl space-y-5 rounded-[30px] border border-[var(--portal-border)] bg-[rgba(19,20,40,0.96)] p-6 text-white shadow-[0_24px_60px_rgba(18,20,41,0.16)]">
            {payload.media.salesVideoUrl ? (
              <StreamableEmbed url={payload.media.salesVideoUrl} title={`${payload.hero.title} sales video`} />
            ) : (
              <p className="text-sm text-[#b8add7]">No sales video configured.</p>
            )}
            {payload.descriptionSection.longDescription ? (
              <p className="text-sm leading-8 text-[#d2c6ee]">{payload.descriptionSection.longDescription}</p>
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
              <div key={card.id} className="rounded-[30px] border border-[var(--portal-border)] bg-[rgba(19,20,40,0.96)] p-6 text-white shadow-[0_24px_60px_rgba(18,20,41,0.16)]">
                <Badge variant={card.id === "audience" ? "premium" : card.id === "includes" ? "success" : "accent"}>{card.title}</Badge>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-[#d2c6ee]">
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
        <section key={section} id="curriculum" className="mx-auto max-w-7xl space-y-7 px-6">
          <SectionIntro eyebrow={payload.curriculumSection.eyebrow} title={payload.curriculumSection.title} body={payload.curriculumSection.body} />
          <div className="grid gap-5">
            {payload.curriculumSection.modules.map((module, index) => (
              <div key={module.moduleTitle} className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[rgba(21,18,40,0.97)] text-white shadow-[0_20px_48px_rgba(18,20,41,0.12)]">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--portal-border)] px-6 py-4">
                  <div className="space-y-3">
                    <Badge variant="portal">Module {index + 1}</Badge>
                    <h3 className="text-3xl leading-none tracking-[-0.03em]">{module.moduleTitle}</h3>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#b7abd9]">
                    {module.lessonCount} lesson{module.lessonCount === 1 ? "" : "s"}
                  </p>
                </div>
                <ol className="grid">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <li
                      key={`${module.moduleTitle}-${lesson.title}`}
                      className="grid gap-3 border-t border-[rgba(88,97,130,0.18)] px-6 py-4 first:border-t-0 lg:grid-cols-[88px_1fr_auto]"
                    >
                      <div className="pt-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8f86b4]">
                        Lesson {lessonIndex + 1}
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-medium text-[#f3ecff]">{lesson.title}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="portal">{lesson.type.replace(/_/g, " ")}</Badge>
                          {lesson.durationLabel ? <Badge variant="muted">{lesson.durationLabel}</Badge> : null}
                          {lesson.dripDays ? <Badge variant="accent">Day {lesson.dripDays}</Badge> : null}
                        </div>
                        {lesson.isPreview && lesson.previewHref ? (
                          <Link href={lesson.previewHref} className="inline-flex rounded-full border border-[rgba(244,210,122,0.26)] bg-[rgba(244,210,122,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d27a]">
                            Watch preview
                          </Link>
                        ) : null}
                      </div>
                      <div className="flex items-start justify-start lg:justify-end">
                        <Badge variant={lesson.isPreview ? "premium" : "portal"}>{lesson.isPreview ? "Preview" : "Included"}</Badge>
                      </div>
                    </li>
                  ))}
                </ol>
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
          <div className="flex justify-center">
            <Badge variant="premium">{payload.includedCoursesSection.courses.length} individual courses</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {payload.includedCoursesSection.courses.map((course, index) => (
              <div key={course.courseUrl} className="rounded-[28px] border border-[var(--portal-border)] bg-[rgba(19,20,40,0.96)] p-6 text-white shadow-[0_24px_60px_rgba(18,20,41,0.16)]">
                <div
                  className="h-48 rounded-[22px] bg-[linear-gradient(135deg,#1b0c34,#2e175f)] bg-cover bg-center"
                  style={
                    course.imageUrl
                      ? {
                          backgroundImage: `linear-gradient(180deg, rgba(12,9,24,0.16), rgba(12,9,24,0.38)), url(${course.imageUrl})`,
                        }
                      : undefined
                  }
                />
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#b8add7]">Included course {index + 1}</p>
                <h3 className="mt-4 text-3xl leading-none tracking-[-0.03em] text-white">{course.title}</h3>
                {course.subtitle ? <p className="mt-3 text-sm leading-7 text-[#d2c6ee]">{course.subtitle}</p> : null}
                {course.instructorName ? <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#b8add7]">{course.instructorName}</p> : null}
                <Link href={course.courseUrl} className="mt-5 inline-flex text-sm font-semibold text-white underline underline-offset-4">
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
          <div className="grid gap-8 rounded-[34px] border border-[var(--portal-border)] bg-[rgba(19,20,40,0.96)] p-6 text-white shadow-[0_24px_60px_rgba(18,20,41,0.16)] lg:grid-cols-[320px_1fr] lg:p-8">
            <div className="space-y-4">
              {payload.instructorSection.imageUrl ? (
                <div
                  className="h-80 rounded-[28px] bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(180deg, rgba(22,12,45,0.08), rgba(22,12,45,0.24)), url(${payload.instructorSection.imageUrl})` }}
                />
              ) : <div className="h-80 rounded-[28px] bg-[linear-gradient(135deg,#1b0c34,#2e175f)]" />}
            </div>
            <div className="flex items-center">
              <div className="max-w-3xl space-y-5">
                <Badge variant="premium">{payload.instructorSection.eyebrow}</Badge>
                <h3 className="text-5xl leading-none tracking-[-0.05em] text-white">{payload.instructorSection.name}</h3>
                {payload.instructorSection.shortBio ? <p className="text-sm leading-8 text-[#d2c6ee]">{payload.instructorSection.shortBio}</p> : null}
                <div className="flex flex-wrap gap-3 pt-2 text-sm text-[#d2c6ee]">
                  {payload.instructorSection.socialLinks.map((social) => (
                    <a key={social.label} href={social.url} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--portal-border)] px-4 py-2 transition hover:bg-[rgba(255,255,255,0.08)]">
                      {social.label}
                    </a>
                  ))}
                </div>
                <Link href={payload.instructorSection.pageUrl} className="inline-flex text-sm font-semibold text-white underline underline-offset-4">
                  View instructor page
                </Link>
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
          <div className="grid gap-4">
            {payload.testimonialsSection.items.map((testimonial, index) => (
              <blockquote
                key={`${testimonial.quote}-${index}`}
                className="grid gap-6 rounded-[30px] border border-[var(--portal-border)] bg-[rgba(19,20,40,0.96)] p-6 text-white shadow-[0_24px_60px_rgba(18,20,41,0.16)] lg:grid-cols-[220px_1fr]"
              >
                <div className="space-y-3 lg:border-r lg:border-[var(--portal-border)] lg:pr-6">
                  {testimonial.name ? <footer className="text-base font-semibold text-white">{testimonial.name}</footer> : null}
                  {testimonial.source ? <p className="text-sm text-[#b8add7]">{testimonial.source}</p> : null}
                </div>
                <div className="space-y-4">
                  <RatingStars rating={testimonial.rating} />
                  <p className="text-lg leading-8 text-[#d2c6ee]">&ldquo;{testimonial.quote}&rdquo;</p>
                </div>
              </blockquote>
            ))}
          </div>
          {reviewSlot ? <div className="pt-2">{reviewSlot}</div> : null}
        </section>
      );
    }

    if (section === "faqs") {
      return (
        <section key={section} className="mx-auto max-w-7xl space-y-8 px-6">
          <SectionIntro eyebrow={payload.faqSection.eyebrow} title={payload.faqSection.title} />
          <div className="grid gap-4">
            {payload.faqSection.items.map((faq) => (
              <div key={faq.question} className="rounded-[28px] border border-[var(--portal-border)] bg-[rgba(19,20,40,0.96)] p-6 text-white shadow-[0_24px_60px_rgba(18,20,41,0.16)]">
                <h3 className="text-xl leading-none tracking-[-0.02em] text-white">{faq.question}</h3>
                <p className="mt-3 text-sm leading-8 text-[#d2c6ee]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (section === "pricing") {
      return (
        <section key={section} className="mx-auto max-w-7xl px-6">
          <div className="rounded-[38px] bg-[rgba(19,20,40,0.98)] px-8 py-9 text-white shadow-[0_28px_60px_rgba(18,20,41,0.16)]">
            <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr] lg:items-end">
              <div>
                <Badge variant="premium">{payload.pricingSection.badge}</Badge>
                <h2 className="mt-4 max-w-2xl text-4xl leading-none tracking-[-0.045em] lg:text-[3.25rem]">{payload.pricingSection.headline}</h2>
                <p className="mt-3 max-w-xl text-base leading-8 text-[#bdb3da]">{payload.pricingSection.body}</p>
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
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[rgba(143,44,255,0.18)] bg-[linear-gradient(135deg,rgba(143,44,255,0.12),rgba(212,168,70,0.10))] p-6">
              <div className="max-w-2xl">
                <h3 className="text-3xl leading-none tracking-[-0.04em] lg:text-[2.45rem]">{payload.finalCta.label}</h3>
                <p className="mt-3 text-base leading-8 text-[#ece3ff]">{payload.finalCta.body}</p>
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
    <div className="space-y-16">
      <section className="px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[42px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#150a2f,#110a24)] px-8 py-12 text-white shadow-[0_34px_80px_rgba(10,11,24,0.28)] lg:px-12 lg:py-16">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              backgroundImage: payload.hero.imageUrl
                ? `radial-gradient(circle_at_20%_18%,rgba(168,102,255,0.24),transparent 24%),radial-gradient(circle_at_78%_24%,rgba(212,168,70,0.14),transparent 20%),linear-gradient(180deg, rgba(10,7,20,0.30), rgba(10,7,20,0.70)), url(${payload.hero.imageUrl})`
                : "radial-gradient(circle_at_20%_18%,rgba(168,102,255,0.24),transparent 24%),radial-gradient(circle_at_78%_24%,rgba(212,168,70,0.14),transparent 20%),linear-gradient(135deg,#1b0c34,#2e175f)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,7,23,0.22),rgba(11,7,23,0.82))]" />

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="accent">{payload.hero.eyebrow}</Badge>
              {payload.hero.primaryOffer?.savingsLabel ? <Badge variant="premium">{payload.hero.primaryOffer.savingsLabel}</Badge> : null}
            </div>

            <div className="mt-10 space-y-6">
              {payload.hero.metadataLine ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#b8add7]">{payload.hero.metadataLine}</p>
              ) : null}
              <h1 className="text-6xl leading-[0.9] tracking-[-0.06em] text-[#f2eaff] sm:text-7xl lg:text-[5.8rem]">{payload.hero.title}</h1>
              {payload.hero.subtitle ? <p className="mx-auto max-w-3xl text-xl leading-9 text-[#d0c3ef]">{payload.hero.subtitle}</p> : null}
            </div>

            {payload.hero.primaryOffer ? (
              <div className="mt-10 flex flex-wrap items-end justify-center gap-x-4 gap-y-2">
                <p className="text-5xl font-semibold text-white">{payload.hero.primaryOffer.price}</p>
                {payload.hero.primaryOffer.compareAtPrice ? <p className="text-xl text-[#9a90bd] line-through">{payload.hero.primaryOffer.compareAtPrice}</p> : null}
                {payload.hero.primaryOffer.savingsLabel ? <Badge variant="premium">{payload.hero.primaryOffer.savingsLabel}</Badge> : null}
              </div>
            ) : null}

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href={payload.hero.primaryCtaHref}>
                <Button className="min-w-[280px]">{payload.hero.primaryCtaLabel}</Button>
              </Link>
              <a href={payload.hero.secondaryCtaHref}>
                <Button variant="secondary" className="min-w-[220px] border-white/15 bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.10)]">
                  {payload.hero.secondaryCtaLabel}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {orderedSections.map((section) => renderSection(section))}
    </div>
  );
}
