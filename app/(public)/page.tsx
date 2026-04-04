import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

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
      <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[var(--accent-lavender)]">Perseus Arcane Academy</p>
    </div>
  );
}

function PerseusFooterMark() {
  return (
    <svg viewBox="0 0 84 84" aria-hidden="true" className="h-14 w-14">
      <path d="M42 4 L64 40 H20 Z" fill="var(--perseus-logo-primary)" />
      <path d="M42 20 L74 78 H10 Z" fill="var(--perseus-logo-accent)" opacity="0.9" />
      <path d="M42 10 L56 34 H28 Z" fill="var(--perseus-logo-gold)" opacity="0.85" />
    </svg>
  );
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
    <Link
      href={resolveCoursePublicPath(course)}
      className="flex items-start justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--perseus-collection-elevated)] p-4 transition hover:border-[var(--border-strong)] hover:bg-[rgba(51,51,84,0.98)]"
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
    </Link>
  );
}

function CollectionPanel({
  eyebrow,
  title,
  description,
  tone,
  courses,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tone: CollectionTone;
  courses: HomepageCourse[];
}) {
  const toneVar =
    tone === "arcane"
      ? "var(--collection-arcane)"
      : tone === "discipline"
        ? "var(--collection-discipline)"
        : "var(--collection-gateway)";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] shadow-[var(--shadow-soft)]">
      <div
        className="min-h-[220px] border-b border-[var(--border)] px-7 py-7"
        style={{ backgroundImage: toneVar }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[rgba(240,234,248,0.76)]">{eyebrow}</p>
        <h2 className="mt-5 font-serif text-4xl leading-none tracking-[-0.04em] text-[var(--portal-text)]">{title}</h2>
        <p className="mt-5 max-w-sm text-base leading-8 text-[rgba(240,234,248,0.76)]">{description}</p>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        {courses.map((course) => (
          <CollectionCourseRow key={course.id} course={course} />
        ))}
      </div>
    </article>
  );
}

export default async function HomePage() {
  const [courses, bundles] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ updatedAt: "desc" }],
      take: 12,
      select: {
        id: true,
        title: true,
        slug: true,
        subtitle: true,
        publicPath: true,
        legacyUrl: true,
        testimonials: {
          orderBy: { position: "asc" },
          take: 2,
          select: {
            id: true,
            name: true,
            quote: true,
          },
        },
        offers: {
          where: { isPublished: true },
          orderBy: { price: "asc" },
          take: 1,
          select: {
            price: true,
            currency: true,
          },
        },
      },
    }),
    prisma.bundle.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ updatedAt: "desc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        publicPath: true,
        legacyUrl: true,
        testimonials: {
          orderBy: { position: "asc" },
          take: 1,
          select: {
            id: true,
            name: true,
            quote: true,
          },
        },
      },
    }),
  ]);

  const homepageCourses: HomepageCourse[] = courses.map((course, index) => {
    const offer = course.offers[0];
    const priceLabel = offer ? formatPrice(offer.price.toString(), offer.currency) : null;

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      subtitle: course.subtitle,
      publicPath: course.publicPath,
      legacyUrl: course.legacyUrl,
      priceLabel,
      statusLabel: index === 0 ? "Featured" : "Open now",
      ctaLabel: "Enroll now",
    };
  });

  const featuredCourse = homepageCourses[0] ?? null;
  const featuredCourseHref = featuredCourse ? resolveCoursePublicPath(featuredCourse) : "/faq";
  const featuredBundle = bundles[0] ?? null;
  const featuredBundleHref = featuredBundle ? featuredBundle.publicPath ?? featuredBundle.legacyUrl ?? `/bundle/${featuredBundle.slug}` : featuredCourseHref;

  const collectionSeed = homepageCourses.length > 0 ? homepageCourses : [];
  const threeCourseSlice = (start: number) => {
    if (collectionSeed.length === 0) return [];
    return Array.from({ length: Math.min(3, collectionSeed.length) }, (_, offset) => collectionSeed[(start + offset) % collectionSeed.length]);
  };

  const collections = [
    {
      eyebrow: "Collection 01",
      title: "Hermetic foundations",
      description: "Courses for students entering Perseus through symbolic language, tarot structure, and practical occult study.",
      tone: "arcane" as const,
      courses: threeCourseSlice(0),
    },
    {
      eyebrow: "Collection 02",
      title: "Discipline and practice",
      description: "Courses oriented around consistency, internal development, and direct application rather than scattered theory.",
      tone: "discipline" as const,
      courses: threeCourseSlice(1),
    },
    {
      eyebrow: "Collection 03",
      title: "Gateway entry",
      description: "The clearest starting points for new students who want a structured way into the academy and its study portal.",
      tone: "gateway" as const,
      courses: threeCourseSlice(2),
    },
  ];

  const testimonials = [
    ...courses.flatMap((course) =>
      course.testimonials.map((testimonial) => ({
        ...testimonial,
        source: course.title,
      })),
    ),
    ...bundles.flatMap((bundle) =>
      bundle.testimonials.map((testimonial) => ({
        ...testimonial,
        source: bundle.title,
      })),
    ),
  ].slice(0, 3);

  return (
    <div className="pb-24">
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,var(--perseus-hero-glow),transparent_24%),radial-gradient(circle_at_72%_18%,rgba(212,168,85,0.12),transparent_22%)]" />
        <div className="relative mx-auto flex min-h-[calc(100svh-74px)] max-w-7xl flex-col items-center justify-center px-6 py-16 text-center lg:py-24">
          <PerseusHeroMark />
          <h1 className="mt-7 max-w-6xl font-serif text-6xl leading-[0.88] tracking-[-0.06em] text-[var(--portal-text)] sm:text-7xl lg:text-[6.8rem]">
            PERSEUS ARCANE ACADEMY
          </h1>
          <p className="mt-8 max-w-3xl text-xl leading-9 text-[var(--foreground-soft)]">
            A structured academy for tarot, ritual, symbolism, and serious magical study. Enter through a course, then continue through a path designed for real practice.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href={featuredCourseHref}>
              <Button className="min-w-[220px]">Explore Courses</Button>
            </Link>
            <Link href={featuredBundleHref}>
              <Button variant="secondary" className="min-w-[220px]">
                View Curriculum
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-3xl space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--accent-lavender)]">Collections</p>
          <h2 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">Perseus study collections</h2>
          <p className="text-lg leading-8 text-[var(--foreground-soft)]">
            Enter the academy through a collection of courses that feels closest to your current line of study.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {collections.map((collection) => (
            <CollectionPanel
              key={collection.title}
              eyebrow={collection.eyebrow}
              title={collection.title}
              description={collection.description}
              tone={collection.tone}
              courses={collection.courses}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-3xl space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--premium)]">Testimonies</p>
          <h2 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--portal-text)]">What students say after entering the work</h2>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.id}
              className="rounded-[30px] border border-[var(--border)] bg-[var(--perseus-collection-panel)] p-7 shadow-[var(--shadow-soft)]"
            >
              <blockquote className="text-lg leading-9 text-[var(--portal-text)]">&ldquo;{testimonial.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-lavender)]">{testimonial.name}</p>
                <p className="text-sm text-[var(--foreground-soft)]">{testimonial.source}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <PerseusFooterMark />
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--portal-text)]">Perseus Arcane Academy</p>
                <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--foreground-soft)]">Tarot, ritual, symbolism</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={featuredCourseHref}>
                <Button className="min-w-[180px]">Explore courses</Button>
              </Link>
              <Link href={featuredBundleHref}>
                <Button variant="secondary" className="min-w-[180px]">View curriculum</Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-lavender)]">Study</p>
            <div className="space-y-3 text-sm text-[var(--foreground-soft)]">
              <Link href={featuredCourseHref} className="block transition hover:text-[var(--portal-text)]">
                Featured course
              </Link>
              <Link href={featuredBundleHref} className="block transition hover:text-[var(--portal-text)]">
                Curriculum bundle
              </Link>
              <Link href="/faq" className="block transition hover:text-[var(--portal-text)]">
                FAQ
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-lavender)]">Portal</p>
            <div className="space-y-3 text-sm text-[var(--foreground-soft)]">
              <Link href="/login" className="block transition hover:text-[var(--portal-text)]">
                Student login
              </Link>
              <Link href="/dashboard" className="block transition hover:text-[var(--portal-text)]">
                Dashboard
              </Link>
              <Link href="/admin" className="block transition hover:text-[var(--portal-text)]">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
