import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { getHomepageSections } from "@/lib/homepage/get-homepage-sections";
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

function getCollectionDescription(title: string, description: string) {
  const trimmed = description.trim();
  const isPlaceholder = trimmed.length < 12 || /^([a-z])\1+$/i.test(trimmed);

  if (isPlaceholder) {
    return `A focused Perseus study path for ${title.toLowerCase()}.`;
  }

  return trimmed;
}

function CollectionPanel({
  eyebrow,
  title,
  description,
  imageUrl,
  tone,
  href,
}: {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl?: string;
  tone: CollectionTone;
  href: string;
}) {
  const toneVar =
    tone === "arcane"
      ? "var(--collection-arcane)"
      : tone === "discipline"
        ? "var(--collection-discipline)"
        : "var(--collection-gateway)";

  return (
    <Link href={href} className="group block h-full">
      <article
        className="perseus-collection-panel grid h-full min-h-[360px] overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] shadow-[var(--collection-panel-shadow)] transition duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)]"
      >
        <div
          className="relative min-h-[150px] overflow-hidden border-b border-[var(--border)]"
          style={{
            backgroundImage: imageUrl
              ? `linear-gradient(180deg, rgba(13, 13, 26, 0.1), rgba(13, 13, 26, 0.58)), ${toneVar}, url(${imageUrl})`
              : toneVar,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(192,132,252,0.24),transparent_28%)] transition group-hover:opacity-80" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,var(--premium),transparent)] opacity-70" />
          <p className="relative p-6 text-[11px] font-semibold uppercase tracking-[0.34em] text-[rgba(250,250,250,0.78)]">{eyebrow}</p>
        </div>

        <div className="flex min-h-0 flex-col justify-between p-6 lg:p-7">
          <div>
            <h2 className="font-serif text-4xl leading-none tracking-[-0.04em] text-[var(--portal-text)] lg:text-[2.8rem]">{title}</h2>
            <p className="mt-4 line-clamp-3 text-sm leading-7 text-[var(--foreground-soft)]">{getCollectionDescription(title, description)}</p>
          </div>
          <p className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--premium)] transition group-hover:text-[var(--accent-lavender)]">
            View collection
            <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
          </p>
        </div>
      </article>
    </Link>
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
  }>;
}) {
  return (
    <section className="perseus-home-collections mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto mb-10 max-w-4xl space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-lavender)]">{payload.eyebrow}</p>
        <h2 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">{payload.title}</h2>
        <p className="text-lg leading-8 text-[var(--foreground-soft)]">{payload.description}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {collections.map((collection, index) => (
          <CollectionPanel
            key={`${collection.id}-${index}`}
            eyebrow={collection.eyebrow ?? `Collection ${index + 1}`}
            title={collection.title}
            description={collection.description}
            imageUrl={collection.imageUrl ?? undefined}
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
            imageUrl: collection.imageUrl,
            tone: collection.tone,
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
