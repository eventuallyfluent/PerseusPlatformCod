import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { CourseCard } from "@/components/public/course-card";
import { InstructorCard } from "@/components/public/instructor-card";
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
  const [courses, bundles, instructors] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        subtitle: true,
        heroImageUrl: true,
        publicPath: true,
        legacyUrl: true,
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
      orderBy: { updatedAt: "desc" },
      take: 2,
      select: {
        id: true,
        title: true,
        slug: true,
        subtitle: true,
        shortDescription: true,
        heroImageUrl: true,
        publicPath: true,
        legacyUrl: true,
        courses: {
          select: { id: true },
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
    prisma.instructor.findMany({
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        slug: true,
        name: true,
        shortBio: true,
        imageUrl: true,
      },
    }),
  ]);

  const courseCards = courses.map((course, index) => {
    const offer = course.offers[0];
    return {
      ...course,
      priceLabel: offer ? formatPrice(offer.price.toString(), offer.currency) : null,
      statusLabel: index === 0 ? "Featured" : "Open now",
      ctaLabel: offer && Number(offer.price) === 0 ? "Enroll free" : "Enroll now",
    };
  });

  const featuredCourse = courseCards[0] ?? null;
  const featuredBundle = bundles[0] ?? null;
  const featuredCourseHref = featuredCourse ? resolveCoursePublicPath(featuredCourse) : "/faq";
  const featuredBundleHref = featuredBundle ? featuredBundle.publicPath ?? featuredBundle.legacyUrl ?? `/bundle/${featuredBundle.slug}` : featuredCourseHref;
  const featuredCoursePrice = featuredCourse?.priceLabel ?? "Open preview";
  const featuredBundlePrice = featuredBundle?.offers[0] ? formatPrice(featuredBundle.offers[0].price.toString(), featuredBundle.offers[0].currency) : "Included";

  return (
    <div className="pb-24">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(143,44,255,0.16),transparent_24%),radial-gradient(circle_at_70%_40%,rgba(212,168,70,0.16),transparent_24%)]" />
        <div className="relative mx-auto grid min-h-[calc(100svh-74px)] max-w-7xl gap-14 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-18">
          <div className="space-y-8">
            <div className="flex flex-wrap gap-3">
              <Badge variant="accent">Structured magical training</Badge>
              <Badge variant="premium">Free and paid entry</Badge>
            </div>
            <div className="space-y-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-[var(--muted)]">Perseus Arcane Academy</p>
              <h1 className="max-w-5xl text-6xl leading-[0.9] tracking-[-0.06em] text-[var(--foreground)] sm:text-7xl lg:text-[6rem]">
                Enter through the <span className="text-[var(--accent)]">courses</span>, then stay for the path.
              </h1>
              <p className="max-w-3xl text-xl leading-9 text-[var(--foreground-soft)]">
                Every student joins through a course or bundle. Start with a free gateway, enter directly through a paid training, or unlock a full bundle in one checkout.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">Choose your next step below</p>
              <div className="flex flex-wrap gap-4">
                <Link href={featuredCourseHref}>
                  <Button className="min-w-[240px]">
                    {featuredCourse ? `${featuredCourse.title} - ${featuredCoursePrice}` : "Explore featured course"}
                  </Button>
                </Link>
                <Link href={featuredBundleHref}>
                  <Button variant="secondary" className="min-w-[240px]">
                    {featuredBundle ? `View bundle - ${featuredBundlePrice}` : "View learning bundle"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {featuredCourse ? (
              <div className="rounded-[38px] border border-[var(--border)] bg-[rgba(255,255,255,0.78)] p-7 shadow-[var(--shadow-soft)]">
                <div className="rounded-[30px] bg-[linear-gradient(135deg,#160b2d,#211457)] px-8 py-12 text-white">
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="portal">Featured course</Badge>
                    <Badge variant="premium">{featuredCoursePrice}</Badge>
                  </div>
                  <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#b7abd9]">Start here</p>
                  <h2 className="mt-5 text-5xl leading-none tracking-[-0.05em] text-[#ead7ff]">{featuredCourse.title}</h2>
                  {featuredCourse.subtitle ? <p className="mt-6 max-w-xl text-base leading-8 text-[#c9bfe2]">{featuredCourse.subtitle}</p> : null}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href={featuredCourseHref}>
                      <Button className="min-w-[220px]">{featuredCourse.ctaLabel}</Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="ghost" className="min-w-[180px] border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] text-[#ddd5f5] hover:bg-[rgba(255,255,255,0.08)] hover:text-white">
                        Returning student
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.8)] p-5 shadow-[var(--shadow-soft)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Free gateway</p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">Offer an accessible starting point that creates account access through the course itself.</p>
              </div>
              <div className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.8)] p-5 shadow-[var(--shadow-soft)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Paid training</p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">Lead with a premium course hero, clear pricing, and one decisive checkout path.</p>
              </div>
              <div className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.8)] p-5 shadow-[var(--shadow-soft)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">Bundle path</p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground-soft)]">Sell the curriculum stack as one package when the student needs a fuller path.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {featuredBundle ? (
        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-6 rounded-[36px] border border-[var(--border)] bg-[rgba(255,255,255,0.76)] p-8 shadow-[var(--shadow-soft)] lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="space-y-4">
              <Badge variant="premium">Bundle offer</Badge>
              <h2 className="text-5xl leading-none tracking-[-0.05em] text-[var(--foreground)]">{featuredBundle.title}</h2>
              <p className="text-lg leading-8 text-[var(--foreground-soft)]">
                {featuredBundle.shortDescription ?? featuredBundle.subtitle ?? "One checkout. Multiple course enrollments."}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">What this unlocks</p>
                <p className="text-base leading-8 text-[var(--foreground-soft)]">
                  {featuredBundle.courses.length} course{featuredBundle.courses.length === 1 ? "" : "s"} in one purchase path, then normal learner dashboard access underneath.
                </p>
              </div>
              <Link href={featuredBundleHref}>
                <Button variant="premium" className="min-w-[220px]">
                  View bundle - {featuredBundlePrice}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-3xl space-y-4">
            <Badge variant="accent">Courses</Badge>
            <h2 className="text-5xl leading-none tracking-[-0.05em] text-[var(--foreground)]">Choose the course that should sell first.</h2>
            <p className="text-lg leading-8 text-[var(--foreground-soft)]">
              The homepage should merchandise the offer directly: strong title, clear price, and immediate entry into the product page.
            </p>
          </div>
          <Link href="/faq" className="hidden text-sm font-semibold text-[var(--foreground-soft)] underline-offset-4 hover:text-[var(--foreground)] hover:underline md:block">
            Read platform FAQ
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courseCards.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <Badge variant="muted">Teachers</Badge>
            <h2 className="text-4xl leading-none tracking-[-0.04em] text-[var(--foreground)]">Instructor trust belongs under the products, not instead of them.</h2>
          </div>
          <p className="text-lg leading-8 text-[var(--foreground-soft)]">
            The homepage sells courses first, then reassures with instructor credibility. Teachers support the buying decision; they do not replace it.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {instructors.map((instructor) => (
            <InstructorCard key={instructor.slug} instructor={instructor} />
          ))}
        </div>
      </section>
    </div>
  );
}
