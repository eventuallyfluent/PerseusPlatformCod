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
  return `${currency ?? "USD"} ${numericAmount.toFixed(2)}`;
}

function CollectionCourseTile({ course, toneVar }: { course: CollectionCoursePreview; toneVar: string }) {
  return (
    <Link
      href={course.href}
      className="group/course grid h-[96px] w-[190px] flex-none grid-rows-[34px_1fr] overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--surface-panel)] shadow-sm transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel-strong)]"
    >
      <div className="relative min-h-0 overflow-hidden" style={{ backgroundImage: toneVar }}>
        {course.imageUrl ? (
          <Image src={course.imageUrl} alt="" fill sizes="190px" className="object-cover opacity-70 transition group-hover/course:scale-105 group-hover/course:opacity-85" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,var(--accent-soft),transparent_38%)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(13,13,26,0.18))]" />
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-2 px-3 py-2.5">
        <h3 className="min-w-0 truncate text-xs font-semibold leading-5 text-[var(--portal-text)]">{course.title}</h3>
        {course.priceLabel ? (
          <span className="row-span-2 h-fit rounded-full border border-[var(--border)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--premium)]">
            {course.priceLabel}
          </span>
        ) : null}
        <p className="min-w-0 truncate text-[11px] text-[var(--foreground-soft)]">{course.instructorName || "Perseus Arcane"}</p>
      </div>
    </Link>
  );
}

function CollectionRail({
  eyebrow,
  title,
  courseCount,
  courses,
  tone,
  href,
}: {
  eyebrow: string;
  title: string;
  courseCount: number;
  courses: CollectionCoursePreview[];
  tone: CollectionTone;
  href: string;
}) {
  const toneVar = getToneVar(tone);
  const collectionMeta = `${eyebrow} - ${courseCount} course${courseCount === 1 ? "" : "s"}`;

  return (
    <article className="perseus-collection-panel overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] shadow-[var(--collection-panel-shadow)]">
      <div className="flex min-h-[96px] items-start justify-between gap-5 px-6 py-5 lg:px-7">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent-lavender)]">{collectionMeta}</p>
          <h2 className="mt-2 truncate font-serif text-3xl leading-none tracking-[-0.04em] text-[var(--portal-text)] sm:text-4xl">{title}</h2>
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-[10px] border border-[var(--border)] bg-[var(--button-secondary-background)] px-4 py-2 text-xs font-semibold text-[var(--button-secondary-text)] transition hover:border-[var(--border-strong)] hover:bg-[var(--button-secondary-hover)]"
        >
          View all -&gt;
        </Link>
      </div>

      <div className="flex min-h-[128px] items-stretch gap-3 overflow-x-auto border-t border-[var(--border)] p-4">
        {courses.length > 0 ? (
          courses.map((course) => <CollectionCourseTile key={course.id} course={course} toneVar={toneVar} />)
        ) : (
          <div className="flex h-[96px] w-[190px] flex-none items-center rounded-[12px] border border-dashed border-[var(--border)] px-4 text-sm font-medium text-[var(--foreground-soft)]">
            Courses coming soon
          </div>
        )}
        <div className="min-w-[120px] flex-1 rounded-[12px] border border-[var(--border)] bg-[var(--accent-soft)]" style={{ backgroundImage: toneVar }} />
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
    tone: string;
    courseCount: number;
    courses: CollectionCoursePreview[];
  }>;
}) {
  return (
    <section className="perseus-home-collections mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto mb-10 max-w-4xl space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-lavender)]">{payload.eyebrow}</p>
        <h2 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">{payload.title}</h2>
        <p className="text-lg leading-8 text-[var(--foreground-soft)]">{payload.description}</p>
      </div>

      <div className="grid gap-7">
        {collections.map((collection, index) => (
          <CollectionRail
            key={`${collection.id}-${index}`}
            eyebrow={collection.eyebrow ?? `Collection ${index + 1}`}
            title={collection.title}
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
      <div className="mx-auto mb-10 max-w-4xl space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--premium)]">{payload.eyebrow}</p>
        <h2 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">{payload.title}</h2>
        {payload.description ? <p className="text-lg leading-8 text-[var(--foreground-soft)]">{payload.description}</p> : null}
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
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-lavender)]">{payload.eyebrow}</p>
          <h2 className="mt-4 font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">{payload.title}</h2>
          <p className="mt-5 text-lg leading-8 text-[var(--foreground-soft)]">{payload.description}</p>
        </div>
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
          tone: true,
          _count: {
            select: {
              courses: true,
            },
          },
          courses: {
            orderBy: { position: "asc" },
            take: 3,
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
