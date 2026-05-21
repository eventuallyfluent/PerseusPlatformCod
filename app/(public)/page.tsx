import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { getHomepageSections } from "@/lib/homepage/get-homepage-sections";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { resolveCollectionPublicPath } from "@/lib/urls/resolve-collection-path";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildOrganizationStructuredData, buildWebsiteStructuredData } from "@/lib/seo/structured-data";
import { getPublicReviewName } from "@/lib/testimonials/public-review-name";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import type {
  HomepageCollectionsPayload,
  HomepageEmailSignupPayload,
  HomepageHeroPayload,
  HomepageTestimoniesPayload,
} from "@/lib/homepage/sections";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({
  title: "Structured Magical Training",
  description: "Browse Perseus Arcane Academy courses, bundles, instructors, and public training paths on their canonical public URLs.",
  path: "/",
});

function PerseusHeroMark() {
  return (
    <div className="mx-auto flex w-fit flex-col items-center gap-4">
      <svg viewBox="0 0 84 84" aria-hidden="true" className="h-16 w-16">
        <path d="M42 4 L64 40 H20 Z" fill="var(--perseus-logo-primary)" />
        <path d="M42 20 L74 78 H10 Z" fill="var(--perseus-logo-accent)" opacity="0.9" />
        <path d="M42 10 L56 34 H28 Z" fill="var(--perseus-logo-gold)" opacity="0.85" />
      </svg>
    </div>
  );
}

function normalizeHeroText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

type CollectionTone = "arcane" | "discipline" | "gateway";

type CollectionCoursePreview = {
  id: string;
  title: string;
  href: string;
  instructorName?: string | null;
  imageUrl?: string | null;
  priceLabel?: string | null;
};

function getToneVar(tone: CollectionTone) {
  if (tone === "arcane") return "var(--collection-arcane)";
  if (tone === "discipline") return "var(--collection-discipline)";
  return "var(--collection-gateway)";
}

function readMoney(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function formatPriceLabel(amount: unknown, currency?: string | null) {
  const numericAmount = readMoney(amount);
  if (numericAmount === null) return null;
  if (numericAmount <= 0) return "Free";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
      maximumFractionDigits: Number.isInteger(numericAmount) ? 0 : 2,
    }).format(numericAmount);
  } catch {
    return `${currency ?? "USD"} ${numericAmount.toFixed(2)}`;
  }
}

function getCollectionDescription(title: string, description: string) {
  const trimmed = description.trim();
  const isPlaceholder = trimmed.length < 12 || /^([a-z])\1+$/i.test(trimmed);

  if (isPlaceholder) {
    return `A focused Perseus study path for ${title.toLowerCase()}.`;
  }

  return trimmed;
}

function getEditorialEmphasis(title: string, emphasis: string) {
  const normalizedTitle = title.trim();
  const normalizedEmphasis = emphasis.trim();

  if (!normalizedTitle || !normalizedEmphasis || !normalizedTitle.toLowerCase().endsWith(normalizedEmphasis.toLowerCase())) {
    return { lead: normalizedTitle, emphasis: null };
  }

  const lead = normalizedTitle.slice(0, normalizedTitle.length - normalizedEmphasis.length).trim();
  return {
    lead: lead || normalizedTitle,
    emphasis: lead ? normalizedTitle.slice(normalizedTitle.length - normalizedEmphasis.length).trim() : null,
  };
}

function EditorialSectionHeader({
  eyebrow,
  title,
  description,
  emphasis,
  align = "center",
  tone = "accent",
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
  emphasis?: string;
  align?: "center" | "left";
  tone?: "accent" | "premium";
}) {
  const titleParts = emphasis ? getEditorialEmphasis(title, emphasis) : { lead: title, emphasis: null };
  const alignmentClass = align === "center" ? "mx-auto items-center text-center" : "items-start text-left";
  const eyebrowClass = tone === "premium" ? "text-[var(--premium)]" : "text-[var(--accent-lavender)]";

  return (
    <div className={`perseus-editorial-section-header flex max-w-4xl flex-col ${alignmentClass}`}>
      <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.32em] ${eyebrowClass}`}>{eyebrow}</p>
      <h2 className="mt-5 font-serif text-[clamp(2rem,4vw,3.35rem)] leading-[1.05] text-[var(--portal-text)]">
        {titleParts.lead}
        {titleParts.emphasis ? (
          <>
            <br />
            <span className="perseus-editorial-title-emphasis">{titleParts.emphasis}</span>
          </>
        ) : null}
      </h2>
      {description ? <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--foreground-soft)] sm:text-lg">{description}</p> : null}
    </div>
  );
}

function CollectionCourseTile({ course, toneVar }: { course: CollectionCoursePreview; toneVar: string }) {
  return (
    <Link
      href={course.href}
      className="group/course block w-[220px] flex-none scroll-ml-6 overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface-panel)] text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel-strong)] hover:shadow-[0_18px_42px_rgba(0,0,0,0.22)]"
    >
      <div className="relative h-[128px] overflow-hidden" style={{ backgroundImage: toneVar }}>
        {course.imageUrl ? (
          <Image src={course.imageUrl} alt="" fill sizes="220px" className="object-cover opacity-82 transition duration-300 group-hover/course:scale-105 group-hover/course:opacity-95" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_26%,var(--accent-soft),transparent_42%)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(13,13,26,0.26))]" />
      </div>
      <div className="flex min-h-[126px] flex-col px-4 py-3.5">
        <p className="truncate text-[11px] font-medium tracking-[0.03em] text-[var(--accent-lavender)]">{course.instructorName || "Perseus Arcane"}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-[var(--portal-text)]">{course.title}</h3>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          {course.priceLabel ? <span className="font-mono text-xs font-semibold text-[var(--portal-text)]">{course.priceLabel}</span> : <span />}
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--accent-lavender)]">
            Course
          </span>
        </div>
      </div>
    </Link>
  );
}

function CollectionViewAllCard({ href, title, courseCount }: { href: string; title: string; courseCount: number }) {
  return (
    <Link
      href={href}
      className="group/view-all flex min-h-[254px] w-[170px] flex-none flex-col items-center justify-center gap-3 overflow-hidden rounded-[14px] border border-[var(--border-strong)] bg-[linear-gradient(135deg,var(--brand),var(--brand-hover))] px-5 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[var(--accent-lavender)] hover:shadow-[0_18px_42px_var(--perseus-hero-glow)]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-xl font-semibold text-white transition group-hover/view-all:translate-x-1">
        -&gt;
      </span>
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-white/90">Browse all {title}</span>
      <span className="font-mono text-[10px] text-white/60">
        {courseCount} course{courseCount === 1 ? "" : "s"}
      </span>
    </Link>
  );
}

function CollectionRail({
  eyebrow,
  title,
  description,
  courseCount,
  courses,
  tone,
  href,
}: {
  eyebrow: string;
  title: string;
  description: string;
  courseCount: number;
  courses: CollectionCoursePreview[];
  tone: CollectionTone;
  href: string;
}) {
  const toneVar = getToneVar(tone);
  const collectionMeta = `${eyebrow} - ${courseCount} course${courseCount === 1 ? "" : "s"}`;
  const descriptionText = getCollectionDescription(title, description);

  return (
    <article className="perseus-collection-panel overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] shadow-[var(--collection-panel-shadow)]">
      <div className="flex flex-col gap-5 border-b border-[var(--border)] px-6 py-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent-lavender)]">{collectionMeta}</p>
          <h2 className="mt-2 font-serif text-3xl leading-none tracking-[-0.04em] text-[var(--portal-text)] sm:text-4xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--foreground-soft)]">{descriptionText}</p>
        </div>
        <Link
          href={href}
          className="w-fit shrink-0 rounded-full border border-[var(--border-strong)] bg-[var(--button-secondary-background)] px-5 py-2.5 text-xs font-semibold text-[var(--button-secondary-text)] transition hover:translate-x-0.5 hover:border-[var(--brand)] hover:bg-[var(--button-secondary-hover)]"
        >
          View all -&gt;
        </Link>
      </div>

      <div className="relative p-5 md:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-[linear-gradient(90deg,transparent,var(--perseus-collection-panel))]" />
        <div className="flex snap-x gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {courses.length > 0 ? (
            <>
              {courses.map((course) => <CollectionCourseTile key={course.id} course={course} toneVar={toneVar} />)}
              <CollectionViewAllCard href={href} title={title} courseCount={courseCount} />
            </>
          ) : (
            <div className="flex min-h-[254px] w-[220px] flex-none items-center rounded-[14px] border border-dashed border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground-soft)]">
              Courses coming soon
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function HeroSection({ payload }: { payload: HomepageHeroPayload }) {
  const normalizedBrand = normalizeHeroText("Perseus Arcane Academy");
  const showEyebrow = normalizeHeroText(payload.eyebrow) !== normalizedBrand && normalizeHeroText(payload.eyebrow) !== normalizeHeroText(payload.title);

  return (
    <section className="perseus-home-hero relative overflow-hidden border-b border-[var(--border)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,var(--perseus-hero-glow),transparent_24%),radial-gradient(circle_at_72%_18%,rgba(212,168,85,0.12),transparent_22%)]" />
      <div className="perseus-home-hero-inner relative mx-auto max-w-7xl px-6 py-12 lg:py-18">
        <div className="perseus-home-hero-grid flex min-h-[calc(100svh-74px)] flex-col items-center justify-center gap-12">
          <div className="perseus-home-hero-copy flex max-w-5xl -translate-y-6 flex-col items-center text-center lg:-translate-y-10">
            <PerseusHeroMark />
            {showEyebrow ? (
              <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.42em] text-[var(--accent-lavender)]">{payload.eyebrow}</p>
            ) : null}
            <h1 className="mt-5 max-w-6xl font-serif text-6xl leading-[0.88] tracking-[-0.06em] text-[var(--portal-text)] sm:text-7xl lg:text-[6.8rem]">
              {payload.title}
            </h1>
            <p className="mt-8 max-w-3xl text-xl leading-9 text-[var(--foreground-soft)]">{payload.description}</p>
            <div className="perseus-home-hero-actions mt-10 flex flex-wrap justify-center gap-4">
              <ButtonLink href={payload.primaryCtaHref} className="min-w-[220px]">
                {payload.primaryCtaLabel}
              </ButtonLink>
              <ButtonLink href={payload.secondaryCtaHref} variant="secondary" className="min-w-[220px]">
                {payload.secondaryCtaLabel}
              </ButtonLink>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function CollectionsSection({
  payload,
  collections,
}: {
  payload: HomepageCollectionsPayload;
  collections: Array<{
    id: string;
    slug: string;
    eyebrow: string | null;
    title: string;
    description: string;
    tone: string;
    courseCount: number;
    courses: CollectionCoursePreview[];
  }>;
}) {
  return (
    <section className="perseus-home-collections mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <EditorialSectionHeader
          eyebrow={payload.eyebrow}
          title={payload.title}
          description={payload.description}
          emphasis="study collections"
        />
      </div>

      <div className="grid gap-7">
        {collections.map((collection, index) => (
          <CollectionRail
            key={`${collection.id}-${index}`}
            eyebrow={collection.eyebrow ?? `Collection ${index + 1}`}
            title={collection.title}
            description={collection.description}
            courseCount={collection.courseCount}
            courses={collection.courses}
            tone={(collection.tone as CollectionTone) ?? "arcane"}
            href={resolveCollectionPublicPath(collection)}
          />
        ))}
      </div>
    </section>
  );
}

function TestimoniesSection({
  payload,
  items,
}: {
  payload: HomepageTestimoniesPayload;
  items: Array<{ id: string; name: string; source: string; quote: string }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="perseus-home-testimonies mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <EditorialSectionHeader
          eyebrow={payload.eyebrow}
          title={payload.title}
          description={payload.description}
          emphasis="after entering the work"
          tone="premium"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {items.map((testimonial) => (
          <figure
            key={testimonial.id}
            className="perseus-testimonial-card relative overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] p-7 shadow-[var(--collection-panel-shadow)]"
          >
            <div className="perseus-testimonial-light-accent absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--accent),var(--premium))]" aria-hidden="true" />
            <span className="perseus-testimonial-light-quote pointer-events-none absolute right-5 top-5 font-serif text-7xl leading-none text-[var(--accent)] opacity-[0.055]" aria-hidden="true">
              &ldquo;
            </span>
            <div className="relative z-10 flex h-full flex-col">
              <div className="perseus-testimonial-light-proof mb-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[var(--premium)] bg-[var(--premium-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--premium)]">
                  Student proof
                </span>
                <span className="text-sm leading-none text-[var(--premium)]" aria-label="Five star review">
                  ★★★★★
                </span>
              </div>
              <blockquote className="perseus-testimonial-quote text-lg leading-9 text-[var(--portal-text)]">&ldquo;{testimonial.quote}&rdquo;</blockquote>
              <figcaption className="perseus-testimonial-caption mt-6 space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-lavender)]">{testimonial.name}</p>
                <p className="text-sm text-[var(--foreground-soft)]">{testimonial.source}</p>
              </figcaption>
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}

function EmailSignupSection({ payload }: { payload: HomepageEmailSignupPayload }) {
  return (
    <section className="perseus-home-email mx-auto max-w-7xl px-6 py-16">
      <div className="perseus-email-signup rounded-[34px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] px-8 py-10 shadow-[var(--collection-panel-shadow)] sm:px-10 lg:px-14">
        <EditorialSectionHeader
          eyebrow={payload.eyebrow}
          title={payload.title}
          description={payload.description}
          emphasis="to the work."
        />
        <form action={payload.formActionUrl} className="mx-auto mt-8 max-w-3xl">
          <div className="flex flex-col gap-4 lg:flex-row">
            <input
              type="email"
              name="email"
              placeholder={payload.inputPlaceholder}
              className="h-14 flex-1 rounded-[18px] border border-[var(--border)] bg-[var(--perseus-collection-elevated)] px-5 text-lg text-[var(--portal-text)] placeholder:text-[var(--foreground-soft)] focus:border-[var(--accent)] focus:outline-none"
            />
            <Button type="submit" className="h-14 min-w-[220px] justify-center text-lg">
              {payload.buttonLabel}
            </Button>
          </div>
          <p className="mt-4 text-center text-sm leading-7 text-[var(--foreground-soft)]">{payload.legalText}</p>
        </form>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const sections = (await getHomepageSections()).filter((section) => section.enabled);
  const collectionsSection = sections.find((section) => section.type === "COLLECTIONS");
  const collectionsPayload =
    collectionsSection?.type === "COLLECTIONS" ? (collectionsSection.payload as HomepageCollectionsPayload) : null;
  const testimoniesSection = sections.find((section) => section.type === "TESTIMONIES");
  const testimoniesPayload =
    testimoniesSection?.type === "TESTIMONIES" ? (testimoniesSection.payload as HomepageTestimoniesPayload) : null;

  const featuredCollectionIds = collectionsPayload?.featuredCollectionIds ?? [];
  const collectionRecords = collectionsPayload
    ? await prisma.collection.findMany({
        where: featuredCollectionIds.length > 0 ? { id: { in: featuredCollectionIds } } : undefined,
        select: {
          id: true,
          slug: true,
          eyebrow: true,
          title: true,
          description: true,
          tone: true,
          _count: {
            select: {
              courses: true,
            },
          },
          courses: {
            orderBy: { position: "asc" },
            select: {
              course: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  heroImageUrl: true,
                  publicPath: true,
                  legacyUrl: true,
                  price: true,
                  currency: true,
                  instructor: {
                    select: {
                      name: true,
                    },
                  },
                  offers: {
                    where: { isPublished: true },
                    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
                    take: 1,
                    select: {
                      price: true,
                      currency: true,
                      prices: {
                        orderBy: [{ isDefault: "desc" }],
                        take: 1,
                        select: {
                          amount: true,
                          currency: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ position: "asc" }, { title: "asc" }],
        take: featuredCollectionIds.length > 0 ? undefined : 3,
      })
    : [];

  const useSelectedTestimonials = testimoniesPayload?.sourceMode === "selected";
  const selectedTestimonialIds = useSelectedTestimonials ? (testimoniesPayload?.selectedTestimonialIds ?? []) : [];
  const approvedTestimonials = testimoniesPayload
    ? await prisma.testimonial.findMany({
        where: {
          isApproved: true,
          ...(selectedTestimonialIds.length > 0 ? { id: { in: selectedTestimonialIds } } : {}),
        },
        include: {
          course: { select: { title: true } },
          bundle: { select: { title: true } },
        },
        orderBy: useSelectedTestimonials ? [{ position: "asc" }] : [{ position: "desc" }],
        take: selectedTestimonialIds.length > 0 ? selectedTestimonialIds.length : 6,
      })
    : [];

  const approvedTestimonialsById = new Map(
    approvedTestimonials.map((testimonial) => [
      testimonial.id,
      {
        id: testimonial.id,
        name: getPublicReviewName(testimonial.name),
        source: testimonial.course?.title ?? testimonial.bundle?.title ?? "Student",
        quote: testimonial.quote,
      },
    ]),
  );

  const homepageTestimonials =
    selectedTestimonialIds.length > 0
      ? selectedTestimonialIds
          .map((id) => approvedTestimonialsById.get(id))
          .filter((item): item is { id: string; name: string; source: string; quote: string } => Boolean(item))
      : approvedTestimonials.map((testimonial) => ({
          id: testimonial.id,
          name: getPublicReviewName(testimonial.name),
          source: testimonial.course?.title ?? testimonial.bundle?.title ?? "Student",
          quote: testimonial.quote,
        }));

  const sectionRenderers = sections.map((section) => {
    if (section.type === "HERO") {
      return <HeroSection key={section.type} payload={section.payload as HomepageHeroPayload} />;
    }

    if (section.type === "COLLECTIONS") {
      const payload = section.payload as HomepageCollectionsPayload;
      const collections =
        featuredCollectionIds.length > 0
          ? featuredCollectionIds
              .map((id) => collectionRecords.find((collection) => collection.id === id))
              .filter((item): item is (typeof collectionRecords)[number] => Boolean(item))
          : collectionRecords;

      return (
        <CollectionsSection
          key={section.type}
          payload={payload}
          collections={collections.map((collection) => ({
            id: collection.id,
            slug: collection.slug,
            eyebrow: collection.eyebrow,
            title: collection.title,
            description: collection.description,
            tone: collection.tone,
            courseCount: collection._count.courses,
            courses: collection.courses.map(({ course }) => {
              const primaryOffer = course.offers[0] ?? null;
              const offerPrice = primaryOffer?.prices[0] ?? null;
              const priceAmount = offerPrice?.amount ?? primaryOffer?.price ?? course.price;
              const priceCurrency = offerPrice?.currency ?? primaryOffer?.currency ?? course.currency;

              return {
                id: course.id,
                title: course.title,
                href: resolveCoursePublicPath(course),
                instructorName: course.instructor?.name,
                imageUrl: course.heroImageUrl,
                priceLabel: formatPriceLabel(priceAmount, priceCurrency),
              };
            }),
          }))}
        />
      );
    }

    if (section.type === "TESTIMONIES") {
      return <TestimoniesSection key={section.type} payload={section.payload as HomepageTestimoniesPayload} items={homepageTestimonials} />;
    }

    if (section.type === "EMAIL_SIGNUP") {
      return <EmailSignupSection key={section.type} payload={section.payload as HomepageEmailSignupPayload} />;
    }

    if (section.type === "FOOTER") return null;

    return null;
  });

  const organizationJsonLd = buildOrganizationStructuredData();
  const websiteJsonLd = buildWebsiteStructuredData();

  return (
    <div className="pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      {sectionRenderers}
    </div>
  );
}
