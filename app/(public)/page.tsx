import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { CourseCard } from "@/components/public/course-card";
import { InstructorCard } from "@/components/public/instructor-card";
import { SectionHeading } from "@/components/ui/section-heading";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [courses, instructors] = await Promise.all([
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

  const featuredCourse = courses[0];
  const featuredHref = featuredCourse ? featuredCourse.publicPath ?? featuredCourse.legacyUrl ?? `/course/${featuredCourse.slug}` : "/faq";

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(216,171,86,0.18),transparent_24%),linear-gradient(135deg,#181412_0%,#231d18_55%,#43311f_100%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-[46%] bg-[linear-gradient(180deg,rgba(255,248,238,0.06),rgba(255,248,238,0)),radial-gradient(circle_at_top,rgba(216,171,86,0.16),transparent_48%)] lg:block" />
        <div className="relative mx-auto grid min-h-[calc(100svh-73px)] max-w-7xl gap-12 px-6 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-20">
          <div className="flex max-w-3xl flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[rgba(255,241,214,0.82)]">Perseus Platform</p>
            <h1 className="mt-6 text-6xl leading-[0.95] tracking-[-0.04em] text-stone-50 sm:text-7xl lg:text-8xl">
              Courses that feel ceremonial, not cluttered.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[rgba(255,245,232,0.78)] sm:text-lg">
              Structured course commerce with lucid sales pages, stable migration paths, and a learner experience designed for depth instead
              of noise.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={featuredHref}
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-stone-950 transition hover:brightness-105"
              >
                Explore the platform
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-[rgba(255,245,232,0.2)] bg-[rgba(255,255,255,0.06)] px-6 py-3 text-sm font-semibold text-stone-50 transition hover:bg-[rgba(255,255,255,0.12)]"
              >
                Enter the learner space
              </Link>
            </div>
          </div>

          <div className="grid gap-4 self-end">
            <div className="rounded-[34px] border border-[rgba(255,245,232,0.12)] bg-[rgba(255,251,245,0.08)] p-6 text-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.22)] backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.36em] text-[rgba(255,236,201,0.7)]">Designed for clarity</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-3xl">01</p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(255,245,232,0.75)]">Generated sales pages built from structured course data.</p>
                </div>
                <div>
                  <p className="text-3xl">02</p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(255,245,232,0.75)]">Legacy paths preserved so migration does not fracture discovery.</p>
                </div>
                <div>
                  <p className="text-3xl">03</p>
                  <p className="mt-2 text-sm leading-6 text-[rgba(255,245,232,0.75)]">A connector-based payment core that stays platform-owned.</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[30px] border border-[rgba(255,245,232,0.12)] bg-[rgba(255,251,245,0.08)] p-5 text-[rgba(255,245,232,0.82)] backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.34em] text-[rgba(255,236,201,0.7)]">Platform temperament</p>
                <p className="mt-3 text-sm leading-7">Restrained hierarchy, premium whitespace, and learner-first structure instead of template sprawl.</p>
              </div>
              <div className="rounded-[30px] border border-[rgba(255,245,232,0.12)] bg-[rgba(255,251,245,0.08)] p-5 text-[rgba(255,245,232,0.82)] backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.34em] text-[rgba(255,236,201,0.7)]">Built for real migration</p>
                <p className="mt-3 text-sm leading-7">Course data, sales pages, checkout, imports, and instructors all operate as one connected system.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-18">
        <SectionHeading
          eyebrow="Featured paths"
          title="A cleaner front door for premium study."
          body="The platform leads with a few strong paths instead of a wall of cards: discover courses, understand the structure, then step directly into the learner space."
        />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[34px] border border-[var(--border)] bg-[var(--card-strong)] p-8 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Course commerce</p>
            <h2 className="mt-4 max-w-xl text-5xl leading-none tracking-[-0.04em] text-stone-950">Sales pages stay luminous because the content model stays disciplined.</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-stone-600">
              Every public course page follows the same refined structure: clear promise, embedded video, curriculum preview, instructor context, social proof,
              pricing, and a final call to begin.
            </p>
          </div>
          <div className="grid gap-5">
            <div className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-6 shadow-[var(--shadow-soft)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Migration confidence</p>
              <p className="mt-3 text-sm leading-7 text-stone-600">Legacy links remain explicit, redirects stay intentional, and imported structures can be reviewed before execution.</p>
            </div>
            <div className="rounded-[30px] border border-[var(--border)] bg-[rgba(255,252,247,0.72)] p-6 shadow-[var(--shadow-soft)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Learner calm</p>
              <p className="mt-3 text-sm leading-7 text-stone-600">The dashboard and player prioritize orientation, lesson flow, and focus instead of dashboard clutter.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 border-y border-[var(--border)] py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-stone-500">How the platform feels</p>
            <h2 className="text-5xl leading-none tracking-[-0.04em] text-stone-950">The public side promises restraint. The inside keeps it.</h2>
          </div>
          <div className="grid gap-4 text-sm leading-8 text-stone-600 md:grid-cols-2">
            <p>Generated course fronts stay consistent enough to trust, but spacious enough to feel authored instead of templated.</p>
            <p>Dashboard and lesson flow keep the same language: clear orientation, subdued surfaces, and one decisive action per screen.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Courses"
            title="Generated course fronts"
            body="Published courses appear with the same premium structure, but each still carries its own atmosphere through image, title, and promise."
          />
          <Link href="/faq" className="hidden text-sm font-semibold text-stone-700 underline-offset-4 hover:underline md:block">
            Read platform FAQ
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-18">
        <SectionHeading
          eyebrow="Instructors"
          title="Public teacher profiles with enough room to feel human."
          body="Instructor pages stay structured, but the presentation gives each voice, image, and course list enough breathing room to read like a real platform."
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {instructors.map((instructor) => (
            <InstructorCard key={instructor.slug} instructor={instructor} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-[36px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(30,25,22,1),rgba(60,44,29,0.95))] px-8 py-10 text-stone-50 shadow-[0_28px_70px_rgba(23,20,18,0.18)] sm:px-10">
          <p className="text-[11px] uppercase tracking-[0.36em] text-[rgba(255,237,208,0.68)]">Begin here</p>
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="max-w-2xl text-5xl leading-none tracking-[-0.04em]">A course platform should feel deliberate before anyone clicks buy.</h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-[rgba(255,245,232,0.76)]">
                The next screens carry that same standard into dashboard and lesson flow, so the promise on the public side matches the product on the inside.
              </p>
            </div>
            <Link href="/dashboard" className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-stone-950 transition hover:brightness-105">
              Step into the dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
