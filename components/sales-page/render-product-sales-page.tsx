import Link from "next/link";
import { CheckCircle2, PackageCheck, ShieldCheck, Sparkles, Target, ThumbsUp } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { StreamableEmbed } from "@/components/ui/streamable-embed";
import type { BundleSalesPagePayload, GeneratedSalesPagePayload, SalesPageOfferSummary, SalesPageSectionKey } from "@/types";

type ProductPayload = GeneratedSalesPagePayload | BundleSalesPagePayload;

const sectionPanelClass =
  "perseus-sales-panel rounded-[30px] border border-[var(--border)] bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-[var(--shadow-panel)]";
const sectionPanelStrongClass =
  "perseus-sales-panel-strong rounded-[30px] border border-[var(--border)] bg-[var(--surface-panel-strong)] text-[var(--text-primary)] shadow-[var(--shadow-panel)]";
const panelMutedTextClass = "text-[var(--text-secondary)]";
const panelSubtleTextClass = "text-[var(--text-muted)]";

function cssUrl(url: string) {
  return `url("${url.replace(/"/g, "%22")}")`;
}

function splitIntoParagraphs(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return [];
  }

  const explicitParagraphs = normalized
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs;
  }

  const sentences = normalized.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)?.map((item) => item.trim()).filter(Boolean) ?? [normalized];

  if (sentences.length <= 3) {
    return [normalized];
  }

  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 3) {
    paragraphs.push(sentences.slice(index, index + 3).join(" "));
  }

  return paragraphs;
}

function splitHighlightItems(items: string[]) {
  return items.flatMap((item) =>
    item
      .split(/\s+[•*]\s+|\n+/)
      .map((part) => part.trim().replace(/^[•*-]\s*/, ""))
      .filter(Boolean),
  );
}

function getHighlightTreatment(cardId: "outcomes" | "audience" | "includes") {
  if (cardId === "audience") {
    return {
      icon: Target,
      variant: "premium" as const,
      eyebrow: "Best fit",
      accentClass: "from-[rgba(212,168,85,0.18)] to-transparent",
    };
  }

  if (cardId === "includes") {
    return {
      icon: PackageCheck,
      variant: "success" as const,
      eyebrow: "You receive",
      accentClass: "from-[rgba(52,211,153,0.16)] to-transparent",
    };
  }

  return {
    icon: Sparkles,
    variant: "accent" as const,
    eyebrow: "Transformation",
    accentClass: "from-[rgba(123,47,190,0.2)] to-transparent",
  };
}

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
        <ButtonLink
          key={offer.offerId}
          href={offer.checkoutUrl}
          className="min-w-[240px] bg-[linear-gradient(135deg,var(--accent),#c16bff)] px-6 shadow-[0_18px_34px_rgba(143,44,255,0.24)]"
        >
          {primaryLabel} {offer.price}
        </ButtonLink>
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
      {body ? <p className="text-base leading-8 text-[var(--text-secondary)]">{body}</p> : null}
    </div>
  );
}

export function RenderProductSalesPage({ payload, bundleValueSlot, reviewSlot }: { payload: ProductPayload; bundleValueSlot?: ReactNode; reviewSlot?: ReactNode }) {
  const hidden = new Set(payload.sections.hidden);
  const orderedSections = payload.sections.order.filter((section) => !hidden.has(section));

  const renderSection = (section: SalesPageSectionKey) => {
    if (section === "description") {
      const descriptionParagraphs = payload.descriptionSection.longDescription
        ? splitIntoParagraphs(payload.descriptionSection.longDescription)
        : [];

      return (
        <section key={section} className="mx-auto max-w-7xl space-y-8 px-6">
          <SectionIntro
            eyebrow={payload.descriptionSection.eyebrow}
            title={payload.descriptionSection.title}
            body={payload.descriptionSection.shortDescription}
          />
          <div className={`mx-auto max-w-4xl space-y-5 p-6 ${sectionPanelClass}`}>
            {payload.media.salesVideoUrl ? (
              <StreamableEmbed url={payload.media.salesVideoUrl} title={`${payload.hero.title} sales video`} />
            ) : null}
            {descriptionParagraphs.length > 0 ? (
              <div className="rounded-[26px] border border-[var(--border)] bg-[linear-gradient(135deg,var(--surface-panel-strong),var(--surface-panel))] p-6 lg:p-8">
                <div className="mx-auto max-w-4xl">
                  <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--accent-lavender)]">About the course</p>
                  <div className="mt-6 space-y-5">
                    {descriptionParagraphs.map((paragraph, index) => (
                      <p
                        key={`${paragraph.slice(0, 28)}-${index}`}
                        className={
                          index === 0
                            ? "text-lg leading-9 text-[var(--text-primary)]"
                            : `text-base leading-8 ${panelMutedTextClass}`
                        }
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      );
    }

    if (section === "highlights") {
      return (
        <section key={section} className="mx-auto max-w-7xl space-y-8 px-6">
          <SectionIntro eyebrow={payload.highlightsSection.eyebrow} title="The core promise at a glance." />
          <div className="grid gap-5 lg:grid-cols-3">
            {payload.highlightsSection.cards.map((card) => {
              const treatment = getHighlightTreatment(card.id);
              const Icon = treatment.icon;
              const items = splitHighlightItems(card.items);

              return (
              <div key={card.id} className={`relative overflow-hidden p-6 ${sectionPanelClass}`}>
                <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${treatment.accentClass}`} />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-panel-strong)] text-[var(--accent-lavender)]">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <Badge variant={treatment.variant}>{card.title}</Badge>
                  </div>
                  <p className={`mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] ${panelSubtleTextClass}`}>{treatment.eyebrow}</p>
                  <ul className={`mt-4 space-y-4 text-sm leading-7 ${panelMutedTextClass}`}>
                    {items.length > 0 ? (
                      items.map((item) => (
                        <li key={item} className="grid grid-cols-[18px_minmax(0,1fr)] gap-3">
                          <CheckCircle2 className="mt-1 size-4 text-[var(--accent-lavender)]" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="grid grid-cols-[18px_minmax(0,1fr)] gap-3">
                        <CheckCircle2 className="mt-1 size-4 text-[var(--accent-lavender)]" aria-hidden="true" />
                        <span>Nothing listed yet.</span>
                      </li>
                    )}
                </ul>
                </div>
              </div>
              );
            })}
          </div>
        </section>
      );
    }

    if (section === "gallery" && !payload.gallerySection.hidden && payload.gallerySection.images.length > 0) {
      return (
        <section key={section} className="mx-auto max-w-7xl space-y-8 px-6">
          <SectionIntro eyebrow={payload.gallerySection.eyebrow} title={payload.gallerySection.title} />
          <div className="grid gap-4 md:grid-cols-2">
            {payload.gallerySection.images.map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                className={`min-h-[280px] rounded-[30px] bg-cover bg-center shadow-[var(--shadow-panel)] ${payload.gallerySection.images.length === 1 ? "md:col-span-2 md:min-h-[440px]" : ""}`}
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(12,9,24,0.05), rgba(12,9,24,0.18)), ${cssUrl(imageUrl)}`,
                }}
                aria-label={`${payload.hero.title} sales image ${index + 1}`}
                role="img"
              />
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
              <details key={module.moduleTitle} className={`group overflow-hidden ${sectionPanelStrongClass}`} open={index === 0}>
                <summary className="flex cursor-pointer list-none flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] px-6 py-4 marker:content-none">
                  <div className="space-y-3">
                    <Badge variant="portal">Module {index + 1}</Badge>
                    <h3 className="text-3xl leading-none tracking-[-0.03em]">{module.moduleTitle}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${panelSubtleTextClass}`}>
                      {module.lessonCount} lesson{module.lessonCount === 1 ? "" : "s"}
                    </p>
                    <span className={`text-sm font-semibold text-[var(--accent)] group-open:hidden`}>Open</span>
                    <span className={`hidden text-sm font-semibold text-[var(--accent)] group-open:inline`}>Close</span>
                  </div>
                </summary>
                <ol className="grid">
                  {module.lessons.map((lesson) => (
                    <li
                      key={`${module.moduleTitle}-${lesson.title}`}
                      className="grid gap-3 border-t border-[var(--border)] px-6 py-4 first:border-t-0 lg:grid-cols-[1fr_auto]"
                    >
                      <div className="space-y-2">
                        <p className="text-base font-medium text-[var(--text-primary)]">{lesson.title}</p>
                        <div className="flex flex-wrap gap-2">
                          {lesson.durationLabel ? <Badge variant="muted">{lesson.durationLabel}</Badge> : null}
                          {lesson.dripDays ? <Badge variant="accent">Day {lesson.dripDays}</Badge> : null}
                        </div>
                        {lesson.isPreview && lesson.previewHref ? (
                          <Link href={lesson.previewHref} className="inline-flex rounded-full border border-[var(--premium)] bg-[var(--premium-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--premium)]">
                            Watch preview
                          </Link>
                        ) : null}
                      </div>
                      {lesson.isPreview ? (
                        <div className="flex items-start justify-start lg:justify-end">
                          <Badge variant="premium">Free preview</Badge>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </details>
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
              <div key={course.courseUrl} className={`rounded-[28px] p-6 ${sectionPanelClass}`}>
                <div
                  className="h-48 rounded-[22px] bg-[linear-gradient(135deg,#1b0c34,#2e175f)] bg-cover bg-center"
                  style={
                    course.imageUrl
                      ? {
                          backgroundImage: `linear-gradient(180deg, rgba(12,9,24,0.16), rgba(12,9,24,0.38)), ${cssUrl(course.imageUrl)}`,
                        }
                      : undefined
                  }
                />
                <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${panelSubtleTextClass}`}>Included course {index + 1}</p>
                <h3 className="mt-4 text-3xl leading-none tracking-[-0.03em] text-[var(--text-primary)]">{course.title}</h3>
                {course.subtitle ? <p className={`mt-3 text-sm leading-7 ${panelMutedTextClass}`}>{course.subtitle}</p> : null}
                {course.instructorName ? <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] ${panelSubtleTextClass}`}>{course.instructorName}</p> : null}
                <Link href={course.courseUrl} className="mt-5 inline-flex text-sm font-semibold text-[var(--accent)] underline underline-offset-4">
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
          <div className={`grid gap-6 rounded-[30px] p-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:p-6 ${sectionPanelClass}`}>
            <div className="space-y-3">
              {payload.instructorSection.imageUrl ? (
                <div
                  className="aspect-square rounded-[24px] bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(180deg, rgba(22,12,45,0.08), rgba(22,12,45,0.24)), ${cssUrl(payload.instructorSection.imageUrl)}` }}
                />
              ) : <div className="aspect-square rounded-[24px] bg-[linear-gradient(135deg,#1b0c34,#2e175f)]" />}
              <Link href={payload.instructorSection.pageUrl} className="inline-flex text-sm font-semibold text-[var(--accent)] underline underline-offset-4">
                View instructor page
              </Link>
            </div>
            <div className="min-w-0">
              <div className="space-y-4">
                <Badge variant="premium">{payload.instructorSection.eyebrow}</Badge>
                <h3 className="text-4xl leading-none tracking-[-0.04em] text-[var(--text-primary)] lg:text-[2.75rem]">{payload.instructorSection.name}</h3>
                {payload.instructorSection.shortBio ? <p className={`max-w-4xl text-sm leading-7 ${panelMutedTextClass}`}>{payload.instructorSection.shortBio}</p> : null}
                <div className={`flex flex-wrap gap-3 pt-2 text-sm ${panelMutedTextClass}`}>
                  {payload.instructorSection.socialLinks.map((social) => (
                    <a key={social.label} href={social.url} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)]">
                      {social.label}
                    </a>
                  ))}
                </div>
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
                className={`grid gap-6 p-6 lg:grid-cols-[220px_1fr] ${sectionPanelClass}`}
              >
                <div className="space-y-3 lg:border-r lg:border-[var(--border)] lg:pr-6">
                  {testimonial.name ? <footer className="text-base font-semibold text-[var(--text-primary)]">{testimonial.name}</footer> : null}
                  {testimonial.source ? <p className={`text-sm ${panelSubtleTextClass}`}>{testimonial.source}</p> : null}
                  <div className="space-y-2 pt-2 text-sm font-medium text-[var(--text-primary)]">
                    <p className="flex items-center gap-2">
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      Verified Buyer
                    </p>
                    {testimonial.recommendsProduct ? (
                      <p className="flex items-center gap-2">
                        <ThumbsUp className="size-4" aria-hidden="true" />
                        I recommend this product
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-4">
                  <RatingStars rating={testimonial.rating} />
                  <p className={`whitespace-pre-wrap text-lg leading-8 ${panelMutedTextClass}`}>&ldquo;{testimonial.quote}&rdquo;</p>
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
              <div key={faq.question} className={`rounded-[28px] p-6 ${sectionPanelClass}`}>
                <h3 className="text-xl leading-none tracking-[-0.02em] text-[var(--text-primary)]">{faq.question}</h3>
                <p className={`mt-3 text-sm leading-8 ${panelMutedTextClass}`}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (section === "pricing") {
      return (
        <section key={section} className="mx-auto max-w-7xl px-6">
          <div className="rounded-[38px] border border-[var(--border)] bg-[var(--surface-panel)] px-8 py-9 text-[var(--text-primary)] shadow-[var(--shadow-panel)]">
            <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr] lg:items-end">
              <div>
                <Badge variant="premium">{payload.pricingSection.badge}</Badge>
                <h2 className="mt-4 max-w-2xl text-4xl leading-none tracking-[-0.045em] lg:text-[3.25rem]">{payload.pricingSection.headline}</h2>
                <p className={`mt-3 max-w-xl text-base leading-8 ${panelMutedTextClass}`}>{payload.pricingSection.body}</p>
              </div>
              <div className="grid gap-3">
                {payload.pricingSection.offers.map((offer) => (
                  <Link
                    key={offer.offerId}
                    href={offer.checkoutUrl}
                    className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel-strong)] px-5 py-4 text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{offer.name}</span>
                      <span className="text-sm font-semibold">{offer.price}</span>
                    </div>
                    {offer.compareAtPrice || offer.savingsLabel ? (
                      <div className={`mt-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] ${panelSubtleTextClass}`}>
                        <span>{offer.compareAtPrice ?? ""}</span>
                        <span>{offer.savingsLabel ?? ""}</span>
                      </div>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[var(--border)] bg-[linear-gradient(135deg,var(--accent-soft),var(--premium-soft))] p-6">
              <div className="max-w-2xl">
                <h3 className="text-3xl leading-none tracking-[-0.04em] lg:text-[2.45rem]">{payload.finalCta.label}</h3>
                <p className={`mt-3 text-base leading-8 ${panelMutedTextClass}`}>{payload.finalCta.body}</p>
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
    <div className="perseus-sales-page space-y-16">
      <section className="px-6">
        <div className="perseus-sales-hero-shell relative mx-auto max-w-7xl overflow-hidden rounded-[42px] border border-[var(--hero-shell-border)] bg-[var(--hero-shell-background)] px-8 py-12 text-[var(--hero-text-primary)] shadow-[var(--hero-shell-shadow)] lg:px-12 lg:py-16">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              backgroundImage: payload.hero.imageUrl
                ? `radial-gradient(circle_at_20%_18%,rgba(168,102,255,0.24),transparent 24%),radial-gradient(circle_at_78%_24%,rgba(212,168,70,0.14),transparent 20%),var(--hero-media-overlay), ${cssUrl(payload.hero.imageUrl)}`
                : "radial-gradient(circle_at_20%_18%,rgba(168,102,255,0.24),transparent 24%),radial-gradient(circle_at_78%_24%,rgba(212,168,70,0.14),transparent 20%),var(--hero-fallback-background)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0 bg-[var(--hero-shell-overlay)]" />

          <div className="perseus-sales-hero-content relative mx-auto max-w-4xl text-center">
            <div className="perseus-sales-hero-badges flex flex-wrap items-center justify-center gap-3">
              <Badge variant="accent">{payload.hero.eyebrow}</Badge>
              {payload.hero.primaryOffer?.savingsLabel ? <Badge variant="premium">{payload.hero.primaryOffer.savingsLabel}</Badge> : null}
            </div>

            <div className="perseus-sales-hero-copy mt-10 space-y-6">
              {payload.hero.metadataLine ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--hero-text-muted)]">{payload.hero.metadataLine}</p>
              ) : null}
              <h1 className="text-6xl leading-[0.9] tracking-[-0.06em] text-[var(--hero-text-primary)] sm:text-7xl lg:text-[5.8rem]">{payload.hero.title}</h1>
              {payload.hero.subtitle ? <p className="mx-auto max-w-3xl text-xl leading-9 text-[var(--hero-text-secondary)]">{payload.hero.subtitle}</p> : null}
            </div>

            {payload.hero.primaryOffer ? (
              <div className="perseus-sales-hero-price mt-10 flex flex-wrap items-end justify-center gap-x-4 gap-y-2">
                <p className="text-5xl font-semibold text-[var(--hero-text-primary)]">{payload.hero.primaryOffer.price}</p>
                {payload.hero.primaryOffer.compareAtPrice ? <p className="text-xl text-[var(--hero-price-muted)] line-through">{payload.hero.primaryOffer.compareAtPrice}</p> : null}
                {payload.hero.primaryOffer.savingsLabel ? <Badge variant="premium">{payload.hero.primaryOffer.savingsLabel}</Badge> : null}
              </div>
            ) : null}

            <div className="perseus-sales-hero-actions mt-10 flex flex-wrap justify-center gap-3">
              <ButtonLink href={payload.hero.primaryCtaHref} className="min-w-[280px]">
                {payload.hero.primaryCtaLabel}
              </ButtonLink>
              <ButtonLink href={payload.hero.secondaryCtaHref} variant="secondary" className="min-w-[220px]">
                {payload.hero.secondaryCtaLabel}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {payload.productType === "course" ? bundleValueSlot : null}
      {orderedSections.map((section) => (
        <Fragment key={section}>
          {section === "pricing" && payload.productType === "course" ? bundleValueSlot : null}
          {renderSection(section)}
        </Fragment>
      ))}
    </div>
  );
}
