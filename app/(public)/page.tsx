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
      take: 6,
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
            name: true,
          },
        },
      },
    }),
    prisma.bundle.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 2,
      select: {
        id: true,
        title: true,
        slug: true,
        subtitle: true,
        shortDescription: true,
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
        offers: {
          where: { isPublished: true },
          orderBy: { price: "asc" },
          take: 1,
          select: {
            id: true,
            price: true,
            currency: true,
            name: true,
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
    };
  });

  const featuredCourse = courseCards[0] ?? null;
  const featuredCourseHref = featuredCourse ? resolveCoursePublicPath(featuredCourse) : "/faq";
  const featuredCourseOffer = featuredCourse?.offers[0] ?? null;
  const featuredCoursePrice = featuredCourse?.priceLabel ?? "Open preview";
  const featuredBundle = bundles[0] ?? null;
  const featuredBundleHref = featuredBundle ? featuredBundle.publicPath ?? featuredBundle.legacyUrl ?? `/bundle/${featuredBundle.slug}` : "/faq";
  const featuredBundleOffer = featuredBundle?.offers[0] ?? null;
  const featuredBundlePrice = featuredBundleOffer ? formatPrice(featuredBundleOffer.price.toString(), featuredBundleOffer.currency) : "Included";

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
      <section className="relative overflow-hidden border-b border-[rgba(49,39,83,0.12)] bg-[linear-gradient(180deg,#f7f1ff_0%,#f8f5f2_52%,#f5f1ff_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_26%,rgba(143,44,255,0.16),transparent_24%),radial-gradient(circle_at_74%_32%,rgba(212,168,70,0.18),transparent_21%),linear-gradient(180deg,transparent,rgba(255,255,255,0.34))]" />
        <div className="relative mx-auto grid min-h-[calc(100svh-74px)] max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
          <div className="space-y-7">
            <div className="flex flex-wrap gap-3">
              <Badge variant="accent">Structured magical training</Badge>
              <Badge variant="premium">Free entry or premium access</Badge>
            </div>
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[var(--accent)]">Perseus Arcane Academy</p>
              <h1 className="max-w-5xl font-serif text-6xl leading-[0.92] tracking-[-0.06em] text-[var(--foreground)] sm:text-7xl lg:text-[6.1rem]">
                Start with the course that opens the path.
              </h1>
              <p className="max-w-3xl text-xl leading-9 text-[var(--foreground-soft)]">
                Enter through a free gateway, a focused paid training, or a bundle that unlocks the wider curriculum in one step.
              </p>
            </div>

            {featuredCourse ? (
              <div className="space-y-4 rounded-[34px] border border-[rgba(143,44,255,0.14)] bg-white/72 p-7 shadow-[0_24px_80px_rgba(53,29,103,0.08)] backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="muted">Featured course</Badge>
                  <Badge variant="premium">{featuredCoursePrice}</Badge>
                  {featuredCourseOffer?.name ? <Badge variant="accent">{featuredCourseOffer.name}</Badge> : null}
                </div>
                <div className="space-y-3">
                  <h2 className="max-w-3xl font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--foreground)]">{featuredCourse.title}</h2>
                  {featuredCourse.subtitle ? <p className="max-w-2xl text-lg leading-8 text-[var(--foreground-soft)]">{featuredCourse.subtitle}</p> : null}
                </div>
                <div className="flex flex-wrap gap-4">
                  <Link href={featuredCourseHref}>
                    <Button className="min-w-[248px]">{featuredCourse.ctaLabel} - {featuredCoursePrice}</Button>
                  </Link>
                  {featuredBundle ? (
                    <Link href={featuredBundleHref}>
                      <Button variant="secondary" className="min-w-[230px]">View full bundle</Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[38px] border border-[rgba(33,20,87,0.12)] bg-[linear-gradient(135deg,#120822,#1f1048_56%,#1b1544)] p-8 text-white shadow-[0_24px_90px_rgba(16,10,40,0.3)]">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Badge variant="portal">Most direct entry</Badge>
                {featuredBundle ? <Badge variant="premium">{featuredBundlePrice}</Badge> : null}
              </div>
              <div className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#c6a7ff]">Curriculum bundle</p>
                <h2 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[#f2e8ff]">
                  {featuredBundle?.title ?? "The guided curriculum path"}
                </h2>
                <p className="text-base leading-8 text-[#cfc5e4]">
                  {featuredBundle?.shortDescription ??
                    featuredBundle?.subtitle ??
                    "Move straight into the deeper study path with one checkout and multi-course access."}
                </p>
              </div>
              <div className="grid gap-4 border-y border-[rgba(255,255,255,0.1)] py-5 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.26em] text-[#9c8bbc]">Courses</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{featuredBundle?.courses.length ?? 0}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.26em] text-[#9c8bbc]">Course offers</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{courses.length}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.26em] text-[#9c8bbc]">Access</p>
                  <p className="mt-2 text-3xl font-semibold text-white">Instant</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm leading-7 text-[#cfc5e4]">
                  Built for students who want a cleaner path than scattered workshops, random freebies, or disconnected lessons.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href={featuredBundleHref}>
                    <Button variant="premium" className="min-w-[220px]">Unlock the bundle</Button>
                  </Link>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="min-w-[180px] border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-white hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
                    >
                      Returning student
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-14">
        <div className="max-w-3xl space-y-4">
          <Badge variant="accent">Course collections</Badge>
          <h2 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--foreground)]">Choose the kind of entry point you want to sell.</h2>
          <p className="text-lg leading-8 text-[var(--foreground-soft)]">
            The homepage should move people into a clear collection: free entry, premium trainings, or the full curriculum path.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6 rounded-[34px] border border-[var(--border)] bg-white/80 p-7 shadow-[var(--shadow-soft)]">
            <div className="space-y-3">
              <Badge variant="muted">Collections</Badge>
              <h3 className="font-serif text-4xl leading-none tracking-[-0.04em] text-[var(--foreground)]">Three clean paths.</h3>
            </div>
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(249,245,255,0.92)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Free gateway</p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">Use a no-risk course as the easiest way into the academy and into magic-link access.</p>
              </div>
              <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(255,255,255,0.92)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">Premium courses</p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">Lead with direct paid trainings when the promise is focused, specific, and conversion-ready.</p>
              </div>
              <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(255,248,233,0.9)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9f7413]">Bundle path</p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">Sell the larger curriculum as one decision when the student already wants the full path.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courseCards.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-12">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div className="space-y-4">
            <Badge variant="premium">Testimonials</Badge>
            <h2 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[var(--foreground)]">Proof belongs under the offer, not above it.</h2>
          </div>
          <p className="max-w-3xl text-lg leading-8 text-[var(--foreground-soft)]">
            Once the hero and collections are doing their job, social proof only needs to confirm that the training is structured, clear, and worth entering.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <figure key={testimonial.id} className="rounded-[30px] border border-[var(--border)] bg-white/80 p-7 shadow-[var(--shadow-soft)]">
              <blockquote className="text-lg leading-9 text-[var(--foreground)]">“{testimonial.quote}”</blockquote>
              <figcaption className="mt-6 space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{testimonial.name}</p>
                <p className="text-sm text-[var(--foreground-soft)]">{testimonial.source}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-6 max-w-7xl px-6 pb-8 pt-12">
        <div className="flex flex-col gap-8 rounded-[34px] border border-[var(--border)] bg-[linear-gradient(135deg,#120822,#1f1048)] px-7 py-8 text-white shadow-[0_24px_90px_rgba(16,10,40,0.28)] lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#c6a7ff]">Perseus Arcane Academy</p>
            <h2 className="font-serif text-4xl leading-none tracking-[-0.04em] text-[#f2e8ff]">Sell the path clearly. Let the courses do the inviting.</h2>
            <p className="text-base leading-8 text-[#cfc5e4]">
              Students should land on a real offer, see the next step immediately, and move into either a free gateway, a premium course, or the curriculum bundle.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={featuredCourseHref}>
              <Button className="min-w-[210px]">
                {featuredCourse ? `View ${featuredCourse.title}` : "Explore courses"}
              </Button>
            </Link>
            {featuredBundle ? (
              <Link href={featuredBundleHref}>
                <Button variant="premium" className="min-w-[210px]">View bundle</Button>
              </Link>
            ) : null}
            <Link href="/login">
              <Button
                variant="ghost"
                className="min-w-[180px] border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-white hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
              >
                Student login
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
