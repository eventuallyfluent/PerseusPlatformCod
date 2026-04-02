import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getDashboardCourseState } from "@/lib/courses/dashboard-progress";
import { Card } from "@/components/ui/card";
import { LearnerContextBar } from "@/components/public/learner-context-bar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireSession();

  const enrollments = await prisma.enrollment.findMany({
    where: { user: { email: session.user.email! } },
    include: {
      course: {
        include: {
          instructor: true,
          modules: {
            include: {
              lessons: {
                orderBy: { position: "asc" },
              },
            },
            orderBy: { position: "asc" },
          },
          faqs: {
            orderBy: { position: "asc" },
          },
          testimonials: {
            orderBy: { position: "asc" },
          },
          offers: {
            include: {
              prices: true,
            },
          },
          pages: true,
        },
      },
    },
  });

  const courseStates = enrollments.map((enrollment) => ({
    enrollment,
    state: getDashboardCourseState(enrollment.course, enrollment.enrolledAt),
  }));
  const spotlight = courseStates[0] ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-6 py-10">
      <LearnerContextBar
        title="Your learner dashboard"
        description="A single place to pick up your next lesson, see what is already open, and move through drip-based courses without losing orientation."
        identity={session.user.name ?? session.user.email!}
        primaryHref={spotlight?.state.nextLesson ? `/learn/${spotlight.enrollment.course.slug}/${spotlight.state.nextLesson.slug}` : undefined}
        primaryLabel={spotlight?.state.nextLesson ? "Resume spotlight course" : undefined}
        secondaryHref="/"
        secondaryLabel="Browse public front"
      />

      <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[40px] border border-[var(--border)] bg-[linear-gradient(135deg,#171412,#2d2118)] px-8 py-10 text-stone-50 shadow-[0_28px_70px_rgba(23,20,18,0.2)]">
          <p className="text-[11px] uppercase tracking-[0.38em] text-[rgba(255,237,208,0.68)]">Learner dashboard</p>
          <h1 className="mt-5 text-6xl leading-[0.95] tracking-[-0.04em]">Your study space stays calm, even when the catalog grows.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[rgba(255,245,232,0.76)]">
            See what is ready to open now, where to begin next, and which lessons are still on their drip path without losing the thread of the course.
          </p>
        </div>
        <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-[rgba(255,252,247,0.76)]">
          <div className="grid gap-px bg-[var(--border)] sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="bg-[rgba(255,252,247,0.9)] p-6">
              <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Enrollments</p>
              <p className="mt-3 text-4xl text-stone-950">{courseStates.length}</p>
            </div>
            <div className="bg-[rgba(255,252,247,0.9)] p-6">
              <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Ready now</p>
              <p className="mt-3 text-4xl text-stone-950">{courseStates.reduce((sum, item) => sum + item.state.unlockedCount, 0)}</p>
            </div>
            <div className="bg-[rgba(255,252,247,0.9)] p-6">
              <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">In motion</p>
              <p className="mt-3 text-4xl text-stone-950">{courseStates.filter((item) => item.state.nextLockedLesson).length}</p>
            </div>
          </div>
        </div>
      </section>

      {spotlight ? (
        <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Card className="space-y-5 bg-[var(--card-strong)] p-8">
            <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Spotlight course</p>
            <div className="space-y-3">
              <h2 className="text-5xl leading-none tracking-[-0.04em] text-stone-950">{spotlight.enrollment.course.title}</h2>
              <p className="max-w-2xl text-base leading-8 text-stone-600">{spotlight.enrollment.course.shortDescription}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Status</p>
                <p className="mt-2 text-lg font-semibold text-stone-950">{spotlight.state.statusLabel}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Available now</p>
                <p className="mt-2 text-lg font-semibold text-stone-950">
                  {spotlight.state.unlockedCount} / {spotlight.state.lessonCount}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Instructor</p>
                <p className="mt-2 text-lg font-semibold text-stone-950">{spotlight.enrollment.course.instructor.name}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                <span>Open progress</span>
                <span>{spotlight.state.completionPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-stone-200">
                <div className="h-2 rounded-full bg-stone-950" style={{ width: `${spotlight.state.completionPercent}%` }} />
              </div>
            </div>
            {spotlight.state.nextLesson ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/learn/${spotlight.enrollment.course.slug}/${spotlight.state.nextLesson.slug}`}
                  className="rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
                >
                  Open {spotlight.state.nextLesson.title}
                </Link>
                <Link
                  href={spotlight.enrollment.course.publicPath ?? spotlight.enrollment.course.legacyUrl ?? `/course/${spotlight.enrollment.course.slug}`}
                  className="rounded-full border border-[var(--border-strong)] px-6 py-3 text-sm font-semibold text-stone-700 transition hover:bg-white/70"
                >
                  View course front
                </Link>
              </div>
            ) : null}
          </Card>
          <Card className="space-y-5">
            <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Drip path</p>
            {spotlight.state.nextLockedLesson ? (
              <>
                <h3 className="text-3xl leading-none tracking-[-0.03em] text-stone-950">{spotlight.state.nextLockedLesson.title}</h3>
                <p className="text-sm leading-7 text-stone-600">
                  This lesson unlocks after {spotlight.state.nextLockedLesson.dripDays ?? 0} days from enrollment, keeping the course paced and deliberate.
                </p>
              </>
            ) : (
              <p className="text-sm leading-7 text-stone-600">Everything in this course is available now.</p>
            )}
          </Card>
        </section>
      ) : (
        <Card className="space-y-4 p-8">
          <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">No courses yet</p>
          <h2 className="text-4xl leading-none tracking-[-0.03em] text-stone-950">Your learner dashboard will open up as soon as you enroll.</h2>
          <p className="max-w-2xl text-base leading-8 text-stone-600">Once a course is purchased, this space becomes the calm control center for study, progress, and lesson access.</p>
        </Card>
      )}

      <section className="space-y-6">
        <div className="max-w-3xl space-y-3">
          <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Course library</p>
          <h2 className="text-5xl leading-none tracking-[-0.04em] text-stone-950">Everything you can enter now.</h2>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          {courseStates.map(({ enrollment, state }) => (
            <article key={enrollment.id} className="rounded-[32px] border border-[var(--border)] bg-[rgba(255,252,247,0.76)] p-7 shadow-[var(--shadow-soft)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">{state.statusLabel}</p>
                  <h3 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">{enrollment.course.title}</h3>
                </div>
                <div className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-stone-600">
                  {state.unlockedCount} of {state.lessonCount} open
                </div>
              </div>
              <p className="text-sm leading-8 text-stone-600">{enrollment.course.shortDescription}</p>
              <div className="mt-5 h-2 rounded-full bg-stone-200">
                <div className="h-2 rounded-full bg-stone-950" style={{ width: `${state.completionPercent}%` }} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Start here</p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">{state.nextLesson?.title ?? "No lessons available yet"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Next lock</p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">{state.nextLockedLesson?.title ?? "Fully open"}</p>
                </div>
              </div>
              {state.nextLesson ? (
                <Link
                  href={`/learn/${enrollment.course.slug}/${state.nextLesson.slug}`}
                  className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
                >
                  Continue learning
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
