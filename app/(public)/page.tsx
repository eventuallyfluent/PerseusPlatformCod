import Link from "next/link";
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
import { HardLink } from "@/components/ui/hard-link";
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

function formatPrice(amount: string | number, currency: string) {
  const numericAmount = typeof amount === "number" ? amount : Number(amount);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
  }).format(numericAmount);
}

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

type HomepageCourse = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  publicPath: string | null;
  legacyUrl: string | null;
  priceLabel: string | null;
  statusLabel: string;
  ctaLabel: string;
};

type CollectionTone = "arcane" | "discipline" | "gateway";

function CollectionCourseRow({ course }: { course: HomepageCourse }) {
  return (
    <HardLink
      href={resolveCoursePublicPath(course)}
      className="perseus-collection-row flex items-start justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--perseus-collection-elevated)] p-4 transition hover:border-[var(--border-strong)] hover:bg-[var(--collection-row-hover)]"
    >
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent-lavender)]">
            {course.statusLabel}
          </span>
          <span className="rounded-full bg-[var(--premium-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--premium)]">
            {course.priceLabel?.toLowerCase() === "free" ? "Free" : "Premium"}
          </span>
        </div>
        <h3 className="text-2xl leading-none tracking-[-0.03em] text-[var(--portal-text)]">{course.title}</h3>
        {course.subtitle ? <p className="max-w-sm text-sm leading-7 text-[var(--portal-muted)]">{course.subtitle}</p> : null}
      </div>
      <div className="pt-1 text-right">
        <p className="text-lg font-semibold text-[var(--portal-text)]">{course.priceLabel ?? "View"}</p>
        <p className="mt-3 text-sm font-semibold text-[var(--accent-lavender)]">{course.ctaLabel}</p>
      </div>
    </HardLink>
  );
}

function CollectionPanel({
  eyebrow,
  title,
  description,
  imageUrl,
  tone,
  href,
  courses,
}: {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl?: string;
  tone: CollectionTone;
  href: string;
  courses: HomepageCourse[];
}) {
  const toneVar =
    tone === "arcane"
      ? "var(--collection-arcane)"
      : tone === "discipline"
        ? "var(--collection-discipline)"
        : "var(--collection-gateway)";

  return (
    <article className="perseus-collection-panel flex h-full flex-col overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] shadow-[var(--collection-panel-shadow)]">
      <div
        className="min-h-[220px] border-b border-[var(--border)] px-7 py-7"
        style={{
          backgroundImage: imageUrl
            ? `linear-gradient(180deg, rgba(13,15,29,0.36), rgba(13,15,29,0.74)), ${toneVar}, url(${imageUrl})`
            : toneVar,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[rgba(240,234,248,0.76)]">{eyebrow}</p>
        <h2 className="mt-5 font-serif text-4xl leading-none tracking-[-0.04em] text-[var(--portal-text)]">{title}</h2>
        <p className="mt-5 max-w-sm text-base leading-8 text-[rgba(240,234,248,0.76)]">{description}</p>
        <Link href={href} className="mt-5 inline-flex text-sm font-semibold text-[var(--premium)]">
          View collection
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        {courses.length > 0 ? (
          courses.map((course) => <CollectionCourseRow key={course.id} course={course} />)
        ) : (
          <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--perseus-collection-elevated)] p-6 text-sm leading-7 text-[var(--foreground-soft)]">
            Add course slugs to this collection in admin settings to populate the panel.
          </div>
        )}
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
    imageUrl: string | null;
    tone: string;
    courses: HomepageCourse[];
  }>;
}) {
  return (
    <section className="perseus-home-collections mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto mb-10 max-w-4xl space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-lavender)]">{payload.eyebrow}</p>
        <h2 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">{payload.title}</h2>
        <p className="text-lg leading-8 text-[var(--foreground-soft)]">{payload.description}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {collections.map((collection, index) => (
          <CollectionPanel
            key={`${collection.id}-${index}`}
            eyebrow={collection.eyebrow ?? `Collection ${index + 1}`}
            title={collection.title}
            description={collection.description}
            imageUrl={collection.imageUrl ?? undefined}
            tone={(collection.tone as CollectionTone) ?? "arcane"}
            href={resolveCollectionPublicPath(collection)}
            courses={collection.courses}
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
          <figure key={testimonial.id} className="perseus-testimonial-card rounded-[30px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] p-7 shadow-[var(--collection-panel-shadow)]">
            <blockquote className="text-lg leading-9 text-[var(--portal-text)]">&ldquo;{testimonial.quote}&rdquo;</blockquote>
            <figcaption className="mt-6 space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-lavender)]">{testimonial.name}</p>
              <p className="text-sm text-[var(--foreground-soft)]">{testimonial.source}</p>
            </figcaption>
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
        include: {
          courses: {
            orderBy: { position: "asc" },
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  subtitle: true,
                  publicPath: true,
                  legacyUrl: true,
                  price: true,
                  currency: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: [{ position: "asc" }, { title: "asc" }],
        take: featuredCollectionIds.length > 0 ? undefined : 3,
      })
    : [];

  const selectedTestimonialIds = testimoniesPayload?.selectedTestimonialIds ?? [];
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
        orderBy: [{ position: "asc" }],
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
            imageUrl: collection.imageUrl,
            tone: collection.tone,
            courses: collection.courses.map(({ course }, index) => ({
              id: course.id,
              title: course.title,
              slug: course.slug,
              subtitle: course.subtitle,
              publicPath: course.publicPath,
              legacyUrl: course.legacyUrl,
              priceLabel: formatPrice(course.price.toString(), course.currency),
              statusLabel: index === 0 ? "Featured" : course.status === "PUBLISHED" ? "Open now" : "Draft",
              ctaLabel: "View course",
            })),
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
