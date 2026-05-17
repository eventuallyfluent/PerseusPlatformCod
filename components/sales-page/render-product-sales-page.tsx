import Link from "next/link";
import { BookOpen, CheckCircle2, ChevronDown, Layers3, PackageCheck, ShieldCheck, Sparkles, Star, Target, ThumbsUp } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { SalesSmartImage } from "@/components/sales-page/sales-smart-image";
import { StreamableEmbed } from "@/components/ui/streamable-embed";
import type { BundleSalesPagePayload, GeneratedSalesPagePayload, SalesPageOfferSummary, SalesPageSectionKey } from "@/types";

type ProductPayload = GeneratedSalesPagePayload | BundleSalesPagePayload;

const sectionPanelClass =
  "perseus-sales-panel rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-[var(--shadow-panel)]";
const sectionPanelStrongClass =
  "perseus-sales-panel-strong rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel-strong)] text-[var(--text-primary)] shadow-[var(--shadow-panel)]";
const panelMutedTextClass = "text-[var(--text-secondary)]";
const panelSubtleTextClass = "text-[var(--text-muted)]";

type DescriptionBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string; isCallout?: boolean };

type ParsedHighlight = {
  bullets: string[];
  chips: string[];
};

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

function looksLikeHeading(value: string) {
  const text = value.trim();

  if (text.length < 4 || text.length > 84) return false;
  if (/[.!?]$/.test(text)) return false;
  if (/^[-*]/.test(text)) return false;

  return /[:：]$/.test(text) || /^[A-Z0-9][A-Za-z0-9\s,'&/()-]+$/.test(text);
}

function isCalloutParagraph(value: string) {
  return /\b(continue|master course|advanced|next step|requirements?|included|bonus|enrol|enroll|access)\b/i.test(value);
}

function parseDescriptionBlocks(value?: string | null): DescriptionBlock[] {
  if (!value) return [];

  const normalized = value.trim();
  if (!normalized) return [];

  const explicitLines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (explicitLines.length > 1) {
    return explicitLines.flatMap((line) =>
      looksLikeHeading(line)
        ? [{ kind: "heading", text: line } as DescriptionBlock]
        : splitIntoParagraphs(line).map((paragraph) => ({
            kind: "paragraph",
            text: paragraph,
            isCallout: isCalloutParagraph(paragraph),
          })),
    );
  }

  return splitIntoParagraphs(normalized).map((paragraph) => ({
    kind: "paragraph",
    text: paragraph,
    isCallout: isCalloutParagraph(paragraph),
  }));
}

function splitHighlightItems(items: string[]) {
  return items.flatMap((item) =>
    item
      .split(/\s+[•*]\s+|\n+|;\s+/)
      .map((part) => part.trim().replace(/^[•*-]\s*/, ""))
      .filter(Boolean),
  );
}

function parseHighlightItems(items: string[], cardId?: "outcomes" | "audience" | "includes"): ParsedHighlight {
  const rawItems = splitHighlightItems(items).flatMap((item) =>
    item
      .split(/\s+(?:•|â€¢|\*)\s+|\n+/)
      .map((part) => part.trim().replace(/^(?:•|â€¢|\*|-)\s*/, ""))
      .filter(Boolean),
  );
  const chips: string[] = [];
  const bullets: string[] = [];

  rawItems.forEach((item) => {
    const parts =
      cardId === "includes"
        ? item
            .split(";")
            .map((part) => part.trim())
            .filter(Boolean)
        : [item];

    parts.forEach((part) => {
      const normalized = part.replace(/^requirements?:\s*/i, "").trim();
      const shouldChip =
        cardId === "includes" &&
        (/\b(module|lesson|course|preview|requirement|access)\b/i.test(part) || normalized.length <= 32);

      if (shouldChip) {
        chips.push(/^requirements?:/i.test(part) && /^none$/i.test(normalized) ? "No requirements" : normalized);
      } else {
        bullets.push(part);
      }
    });
  });

  return {
    chips: Array.from(new Set(chips)).slice(0, 8),
    bullets: Array.from(new Set(bullets)),
  };
}

function isFreeOffer(offer?: SalesPageOfferSummary | null) {
  return Boolean(offer && /(^|\s)(free|\$0|£0|€0|0\.00)/i.test(offer.price));
}

function getPrimaryCtaLabel(payload: ProductPayload) {
  if (payload.productType === "bundle") return "Get the Complete Bundle";
  if (isFreeOffer(payload.hero.primaryOffer)) return "Start Free Course";
  return "Enroll Now";
}

function getPriceLabel(offer?: SalesPageOfferSummary | null) {
  if (!offer) return null;
  return isFreeOffer(offer) ? "Free" : offer.price;
}

function getValueLabel(offer?: SalesPageOfferSummary | null) {
  if (!offer?.compareAtPrice) return null;
  return isFreeOffer(offer) ? `${offer.compareAtPrice} value` : offer.compareAtPrice;
}

function cleanModuleTitle(title: string, index: number) {
  return title.replace(new RegExp(`^\\s*module\\s+${index + 1}\\s*[:\\-–—]?\\s*`, "i"), "").trim() || title;
}

function buildFacts(payload: ProductPayload) {
  const facts: Array<{ label: string; value: string; icon: typeof BookOpen }> = [];

  if (payload.productType === "course") {
    const moduleCount = payload.curriculumSection.modules.length;
    const lessons = payload.curriculumSection.modules.flatMap((module) => module.lessons);
    const previewCount = lessons.filter((lesson) => lesson.isPreview).length;

    if (moduleCount > 0) facts.push({ label: "Modules", value: String(moduleCount), icon: Layers3 });
    if (lessons.length > 0) facts.push({ label: "Lessons", value: String(lessons.length), icon: BookOpen });
    if (previewCount > 0) facts.push({ label: "Free previews", value: String(previewCount), icon: Sparkles });
    if (payload.instructorSection.name) facts.push({ label: "Instructor", value: payload.instructorSection.name, icon: ShieldCheck });
  } else {
    const courseCount = payload.includedCoursesSection.courses.length;
    if (courseCount > 0) facts.push({ label: "Courses", value: String(courseCount), icon: Layers3 });
    if (payload.hero.metadataLine) facts.push({ label: "Bundle", value: payload.hero.metadataLine, icon: PackageCheck });
  }

  if (payload.testimonialsSection.items.length > 0) {
    facts.push({ label: "Student reviews", value: String(payload.testimonialsSection.items.length), icon: Star });
  }

  if (payload.offers.length > 1) {
    facts.push({ label: "Enrollment options", value: String(payload.offers.length), icon: PackageCheck });
  }

  return facts.slice(0, 5);
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
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {offers.map((offer) => (
        <ButtonLink
          key={offer.offerId}
          href={offer.checkoutUrl}
          className="min-h-12 w-full justify-center whitespace-normal bg-[var(--sales-primary-cta-background)] px-6 text-center shadow-[var(--sales-primary-cta-shadow)] sm:w-auto sm:min-w-[240px]"
        >
          {primaryLabel}
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
      <h2 className="text-3xl leading-tight tracking-[-0.04em] text-[var(--foreground)] lg:text-[2.8rem]">{title}</h2>
      {body ? <p className="text-base leading-7 text-[var(--text-secondary)]">{body}</p> : null}
    </div>
  );
}

export function RenderProductSalesPage({
  payload,
  bundleValueSlot,
  questionSlot,
  reviewSlot,
}: {
  payload: ProductPayload;
  bundleValueSlot?: ReactNode;
  questionSlot?: ReactNode;
  reviewSlot?: ReactNode;
}) {
  const hidden = new Set(payload.sections.hidden);
  const orderedSections = payload.sections.order.filter((section) => !hidden.has(section));
  const rendersReviewsSection = orderedSections.includes("testimonials");
  const facts = buildFacts(payload);
  const primaryCtaLabel = getPrimaryCtaLabel(payload);
  const priceLabel = getPriceLabel(payload.hero.primaryOffer);
  const valueLabel = getValueLabel(payload.hero.primaryOffer);
  const hasHeroImage = Boolean(payload.hero.imageUrl);

  const renderSection = (section: SalesPageSectionKey) => {
    if (section === "description") {
      const descriptionBlocks = parseDescriptionBlocks(payload.descriptionSection.longDescription);

      return (
        <section key={section} className="mx-auto max-w-7xl space-y-8 px-6">
          <SectionIntro
            eyebrow={payload.descriptionSection.eyebrow}
            title={payload.descriptionSection.title}
            body={payload.descriptionSection.shortDescription}
          />
          <div className="mx-auto max-w-4xl space-y-5">
            {payload.media.salesVideoUrl ? (
              <StreamableEmbed url={payload.media.salesVideoUrl} title={`${payload.hero.title} sales video`} />
            ) : null}
            {descriptionBlocks.length > 0 ? (
              <div className={`p-5 sm:p-6 lg:p-8 ${sectionPanelStrongClass}`}>
                <div className="mx-auto max-w-3xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent-lavender)]">
                    {payload.productType === "bundle" ? "About the bundle" : "About the course"}
                  </p>
                  <div className="mt-5 space-y-5">
                    {descriptionBlocks.map((block, index) =>
                      block.kind === "heading" ? (
                        <h3 key={`${block.text}-${index}`} className="pt-3 text-xl leading-tight text-[var(--text-primary)]">
                          {block.text.replace(/[:：]$/, "")}
                        </h3>
                      ) : (
                        <p
                          key={`${block.text.slice(0, 28)}-${index}`}
                          className={
                            block.isCallout
                              ? "rounded-[18px] border border-[var(--premium)]/35 bg-[var(--premium-soft)] px-4 py-3 text-base leading-8 text-[var(--text-primary)]"
                              : index === 0
                                ? "text-lg leading-9 text-[var(--text-primary)]"
                                : `text-base leading-8 ${panelMutedTextClass}`
                          }
                        >
                          {block.text}
                        </p>
                      ),
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      );
    }

    if (section === "highlights") {
      const cards = payload.highlightsSection.cards.filter((card) => {
        const parsed = parseHighlightItems(card.items, card.id);
        return parsed.bullets.length > 0 || parsed.chips.length > 0;
      });

      if (cards.length === 0) {
        return null;
      }

      return (
        <section key={section} className="mx-auto max-w-7xl space-y-8 px-6">
          <SectionIntro eyebrow={payload.highlightsSection.eyebrow} title="The core promise at a glance." />
          <div className="grid gap-5 lg:grid-cols-3">
            {cards.map((card) => {
              const treatment = getHighlightTreatment(card.id);
              const Icon = treatment.icon;
              const parsed = parseHighlightItems(card.items, card.id);
              const visibleItems = parsed.bullets.slice(0, 6);
              const hiddenItems = parsed.bullets.slice(6);

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
                  {parsed.chips.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {parsed.chips.map((chip) => (
                        <span key={chip} className="rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)]">
                          {chip}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <ul className={`mt-4 space-y-4 text-sm leading-7 ${panelMutedTextClass}`}>
                    {visibleItems.map((item) => (
                      <li key={item} className="grid grid-cols-[18px_minmax(0,1fr)] gap-3">
                        <CheckCircle2 className="mt-1 size-4 text-[var(--accent-lavender)]" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                </ul>
                  {hiddenItems.length > 0 ? (
                    <details className={`mt-4 text-sm ${panelMutedTextClass}`}>
                      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-lavender)] marker:content-none">
                        Show {hiddenItems.length} more
                        <ChevronDown className="size-3" aria-hidden="true" />
                      </summary>
                      <ul className="mt-4 space-y-4 leading-7">
                        {hiddenItems.map((item) => (
                          <li key={item} className="grid grid-cols-[18px_minmax(0,1fr)] gap-3">
                            <CheckCircle2 className="mt-1 size-4 text-[var(--accent-lavender)]" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
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
          <div className={`grid gap-4 ${payload.gallerySection.images.length === 2 ? "md:grid-cols-[1.2fr_0.8fr]" : "md:grid-cols-2 lg:grid-cols-3"}`}>
            {payload.gallerySection.images.map((imageUrl, index) => (
              <SalesSmartImage
                key={`${imageUrl}-${index}`}
                src={imageUrl}
                alt={`${payload.hero.title} sales image ${index + 1}`}
                variant={index === 0 ? "feature" : "gallery"}
                className={`aspect-[4/3] ${
                  payload.gallerySection.images.length === 1
                    ? "md:col-span-2 lg:col-span-3 md:aspect-[16/9]"
                    : index === 0 && payload.gallerySection.images.length > 2
                      ? "md:col-span-2 md:row-span-2"
                      : ""
                }`}
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
                    <h3 className="text-3xl leading-none tracking-[-0.03em]">{cleanModuleTitle(module.moduleTitle, index)}</h3>
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
              <div key={course.courseUrl} className={`rounded-[24px] p-5 ${sectionPanelClass}`}>
                <SalesSmartImage
                  src={course.imageUrl}
                  alt={`${course.title} course image`}
                  variant="card"
                  className="aspect-video rounded-[20px]"
                />
                <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${panelSubtleTextClass}`}>Included course {index + 1}</p>
                <h3 className="mt-4 text-2xl leading-tight tracking-[-0.03em] text-[var(--text-primary)]">{course.title}</h3>
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
              <SalesSmartImage
                src={payload.instructorSection.imageUrl}
                alt={payload.instructorSection.name}
                variant="avatar"
                fit="cover"
                className="aspect-square rounded-[22px]"
              />
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
      const singleOffer = payload.pricingSection.offers.length === 1 ? payload.pricingSection.offers[0] : null;

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
                {singleOffer ? (
                  <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel-strong)] px-5 py-4 text-[var(--text-primary)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{singleOffer.name}</span>
                      <span className="text-sm font-semibold">{singleOffer.price}</span>
                    </div>
                    {singleOffer.compareAtPrice || singleOffer.savingsLabel ? (
                      <div className={`mt-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] ${panelSubtleTextClass}`}>
                        <span>{singleOffer.compareAtPrice ?? ""}</span>
                        <span>{singleOffer.savingsLabel ?? ""}</span>
                      </div>
                    ) : null}
                    <ButtonLink
                      href={singleOffer.checkoutUrl}
                      className="mt-4 min-h-12 w-full justify-center whitespace-normal bg-[var(--sales-primary-cta-background)] px-6 text-center shadow-[var(--sales-primary-cta-shadow)]"
                    >
                      {primaryCtaLabel}
                    </ButtonLink>
                  </div>
                ) : payload.pricingSection.offers.map((offer) => (
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
            {!singleOffer ? (
              <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[var(--border)] bg-[linear-gradient(135deg,var(--accent-soft),var(--premium-soft))] p-6">
                <div className="max-w-2xl">
                  <h3 className="text-3xl leading-none tracking-[-0.04em] lg:text-[2.45rem]">{payload.finalCta.label}</h3>
                  <p className={`mt-3 text-base leading-8 ${panelMutedTextClass}`}>{payload.finalCta.body}</p>
                </div>
                <OfferButtons offers={payload.pricingSection.offers} primaryLabel={primaryCtaLabel} />
              </div>
            ) : null}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div className="perseus-sales-page space-y-14 overflow-x-hidden lg:space-y-16">
      <section className="px-4 sm:px-6">
        <div className="perseus-sales-hero-shell relative mx-auto max-w-7xl overflow-hidden rounded-[30px] border border-[var(--hero-shell-border)] bg-[var(--hero-shell-background)] p-4 text-[var(--hero-text-primary)] shadow-[var(--hero-shell-shadow)] sm:p-5 lg:p-6">
          <div className="absolute inset-0 bg-[var(--sales-hero-atmosphere)]" />
          <div className={`relative grid gap-6 lg:items-center ${hasHeroImage ? "lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.82fr)]" : ""}`}>
            <div className="px-2 py-5 sm:px-4 lg:px-5 lg:py-8">
              <div className="perseus-sales-hero-badges flex flex-wrap items-center gap-3">
                <Badge variant={isFreeOffer(payload.hero.primaryOffer) ? "success" : "accent"}>
                  {isFreeOffer(payload.hero.primaryOffer) ? "Free Course" : payload.hero.eyebrow}
                </Badge>
                {payload.hero.primaryOffer?.savingsLabel ? <Badge variant="premium">{payload.hero.primaryOffer.savingsLabel}</Badge> : null}
              </div>

              <div className="perseus-sales-hero-copy mt-7 space-y-5">
                {payload.hero.metadataLine ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--hero-text-muted)]">{payload.hero.metadataLine}</p>
                ) : null}
                <h1 className="max-w-3xl text-balance break-words text-3xl leading-[1.02] tracking-[-0.045em] text-[var(--hero-text-primary)] sm:text-5xl lg:text-[4.6rem]">{payload.hero.title}</h1>
                {payload.hero.subtitle ? <p className="max-w-2xl text-base leading-7 text-[var(--hero-text-secondary)] sm:text-lg sm:leading-8">{payload.hero.subtitle}</p> : null}
                {payload.descriptionSection.shortDescription ? (
                  <p className="line-clamp-3 max-w-2xl text-sm leading-7 text-[var(--hero-text-secondary)] sm:text-base">
                    {payload.descriptionSection.shortDescription}
                  </p>
                ) : null}
              </div>

              {payload.hero.primaryOffer ? (
                <div className="perseus-sales-hero-price mt-7 flex flex-wrap items-end gap-x-4 gap-y-2">
                  <p className="text-4xl font-semibold text-[var(--hero-text-primary)]">{priceLabel}</p>
                  {valueLabel ? (
                    <p className={`text-lg ${isFreeOffer(payload.hero.primaryOffer) ? "text-[var(--premium)]" : "text-[var(--hero-price-muted)] line-through"}`}>
                      {valueLabel}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="perseus-sales-hero-actions mt-7 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ButtonLink href={payload.hero.primaryCtaHref} className="min-h-12 w-full max-w-full justify-center whitespace-normal px-5 text-center sm:w-auto sm:px-6">
                  {primaryCtaLabel}
                </ButtonLink>
                <ButtonLink href={payload.hero.secondaryCtaHref} variant="secondary" className="min-h-12 w-full max-w-full justify-center whitespace-normal px-5 text-center sm:w-auto sm:px-6">
                  {payload.hero.secondaryCtaLabel}
                </ButtonLink>
              </div>

              {facts.length > 0 ? (
                <div className="mt-7 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {facts.map((fact) => {
                    const Icon = fact.icon;

                    return (
                      <div key={`${fact.label}-${fact.value}`} className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                        <Icon className="size-4 shrink-0 text-[var(--accent-lavender)]" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--hero-text-muted)]">{fact.label}</p>
                          <p className="truncate text-sm font-semibold text-[var(--hero-text-primary)]">{fact.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {hasHeroImage ? (
              <SalesSmartImage
                src={payload.hero.imageUrl}
                alt={`${payload.hero.title} course image`}
                priority
                variant="hero"
                className="mx-auto aspect-[4/3] w-full max-w-[560px] rounded-[24px] sm:aspect-[1/1] lg:aspect-[0.92/1]"
              />
            ) : null}
          </div>
        </div>
      </section>

      {payload.productType === "course" ? bundleValueSlot : null}
      {orderedSections.map((section) => (
        <Fragment key={section}>
          {section === "pricing" && payload.productType === "course" ? bundleValueSlot : null}
          {renderSection(section)}
          {section === "pricing" && payload.productType === "course" ? questionSlot : null}
        </Fragment>
      ))}
      {questionSlot && payload.productType === "course" && !orderedSections.includes("pricing") ? questionSlot : null}
      {reviewSlot && !rendersReviewsSection ? <section className="mx-auto max-w-7xl px-6">{reviewSlot}</section> : null}
    </div>
  );
}
