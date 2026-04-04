import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { CourseCard } from "@/components/public/course-card";
import { Badge } from "@/components/ui/badge";
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

export default async function HomePage() {
  const [courses, bundles] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ updatedAt: "desc" }],
      take: 9,
      select: {
        id: true,
        title: true,
        slug: true,
        subtitle: true,
        heroImageUrl: true,
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
            id: true,
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
        subtitle: true,
        publicPath: true,
        legacyUrl: true,
        courses: {
          select: { id: true },
        },
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

  const courseCards = courses.map((course, index) => {
    const offer = course.offers[0];
    const numericPrice = offer ? Number(offer.price) : null;

    return {
      ...course,
      priceLabel: offer ? (numericPrice === 0 ? "Free" : formatPrice(offer.price.toString(), offer.currency)) : null,
      statusLabel: numericPrice === 0 ? "Free" : index === 0 ? "Featured" : "Open now",
      ctaLabel: numericPrice === 0 ? "Enroll free" : "Enroll now",
      isFree: numericPrice === 0,
    };
  });

  const featuredCourse = courseCards[0] ?? null;
  const featuredCourseHref = featuredCourse ? resolveCoursePublicPath(featuredCourse) : "/faq";
  const featuredBundle = bundles[0] ?? null;
  const featuredBundleHref = featuredBundle ? featuredBundle.publicPath ?? featuredBundle.legacyUrl ?? `/bundle/${featuredBundle.slug}` : featuredCourseHref;

  const freeCourses = courseCards.filter((course) => course.isFree);
  const paidCourses = courseCards.filter((course) => !course.isFree);
  const foundationalCourses = paidCourses.slice(0, 3);
  const latestCourses = courseCards.slice(0, 3);
  const curatedCollections = [
    {
      eyebrow: "Collection 01",
      title: "Featured trainings",
      description: "The main Perseus courses currently open for direct entry.",
      courses: latestCourses,
    },
    {
      eyebrow: "Collection 02",
      title: "Foundational study",
      description: "Structured symbolic training designed to be studied in order and practiced seriously.",
      courses: foundationalCourses.length > 0 ? foundationalCourses : latestCourses,
    },
    {
      eyebrow: "Collection 03",
      title: "Gateway entry",
      description: "Courses that let new students begin inside the academy before committing to the wider path.",
      courses: freeCourses.length > 0 ? freeCourses : latestCourses,
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
    <div className="bg-[#0d0d1a] text-white">
      <section className="relative overflow-hidden border-b border-[rgba(167,121,255,0.18)] bg-[radial-gradient(circle_at_50%_20%,rgba(136,66,255,0.24),transparent_28%),linear-gradient(180deg,#160b2a_0%,#120a22_55%,#0d0d1a_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(214,167,88,0.08),transparent_20%),radial-gradient(circle_at_80%_20%,rgba(184,112,255,0.12),transparent_24%)]" />
        <div className="relative mx-auto flex min-h-[calc(100svh-74px)] max-w-7xl flex-col items-center justify-center px-6 py-16 text-center lg:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[#a881ff]">Perseus Arcane Academy</p>
          <h1 className="mt-8 max-w-6xl font-serif text-6xl leading-[0.9] tracking-[-0.06em] text-[#eadcff] sm:text-7xl lg:text-[7rem]">
            PERSEUS ARCANE ACADEMY
          </h1>
          <p className="mt-8 max-w-3xl text-xl leading-9 text-[#c9b7ea]">
            Structured training in tarot, ritual, symbolism, and inner development for students who want a real path of study rather than scattered content.
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
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Badge variant="portal">Free entry paths</Badge>
            <Badge variant="accent">Premium courses</Badge>
            <Badge variant="premium">Curriculum bundles</Badge>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-12 px-6 py-16">
        <div className="max-w-3xl space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#a881ff]">Collections</p>
          <h2 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[#f2e8ff]">Course collections</h2>
          <p className="text-lg leading-8 text-[#bdaed7]">
            Enter Perseus through a specific line of study. Each collection is a curated way into the broader academy.
          </p>
        </div>

        <div className="space-y-14">
          {curatedCollections.map((collection) => (
            <section key={collection.title} className="space-y-6">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#a881ff]">{collection.eyebrow}</p>
                <h3 className="font-serif text-4xl leading-none tracking-[-0.04em] text-[#f2e8ff]">{collection.title}</h3>
                <p className="max-w-3xl text-base leading-8 text-[#bdaed7]">{collection.description}</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {collection.courses.map((course) => (
                  <CourseCard key={`${collection.title}-${course.id}`} course={course} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-16">
        <div className="max-w-3xl space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#d8b25f]">Testimonies</p>
          <h2 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[#f2e8ff]">What students say after entering the work</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.id}
              className="rounded-[30px] border border-[rgba(167,121,255,0.18)] bg-[rgba(24,18,42,0.86)] p-7 shadow-[0_20px_70px_rgba(8,5,18,0.3)]"
            >
              <blockquote className="text-lg leading-9 text-[#ece3ff]">&ldquo;{testimonial.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#a881ff]">{testimonial.name}</p>
                <p className="text-sm text-[#bdaed7]">{testimonial.source}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
