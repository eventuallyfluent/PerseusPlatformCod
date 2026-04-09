import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getDashboardCourseState } from "@/lib/courses/dashboard-progress";
import { Badge } from "@/components/ui/badge";

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
    state: null as ReturnType<typeof getDashboardCourseState> | null,
  }));

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });

  const completed = user
    ? await prisma.lessonCompletion.findMany({
        where: {
          userId: user.id,
          lesson: {
            module: {
              courseId: {
                in: enrollments.map((enrollment) => enrollment.courseId),
              },
            },
          },
        },
        select: { lessonId: true },
      })
    : [];

  const completedLessonIds = new Set(completed.map((item) => item.lessonId));
  const hydratedCourseStates = courseStates.map(({ enrollment }) => ({
    enrollment,
    state: getDashboardCourseState(enrollment.course, enrollment.enrolledAt, completedLessonIds),
  }));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(143,44,255,0.08),transparent_18%),linear-gradient(180deg,#0d0f1d,#13152a_34%,#0c0e1d_100%)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="space-y-8">
          <section className="space-y-2">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-lavender)]">Learner dashboard</p>
              <h1 className="text-5xl leading-none tracking-[-0.05em] text-white">Your library</h1>
            </div>
          </section>

          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel-strong)] p-6 text-[var(--portal-text)]">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--portal-muted)]">Owned courses</p>
                <p className="mt-3 text-4xl">{hydratedCourseStates.length}</p>
              </div>
              <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel-strong)] p-6 text-[var(--portal-text)]">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--portal-muted)]">Lessons completed</p>
                <p className="mt-3 text-4xl">{hydratedCourseStates.reduce((sum, item) => sum + item.state.completionCount, 0)}</p>
              </div>
              <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel-strong)] p-6 text-[var(--portal-text)]">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--portal-muted)]">On drip</p>
                <p className="mt-3 text-4xl">{hydratedCourseStates.filter((item) => item.state.nextLockedLesson).length}</p>
              </div>
            </section>

            <section className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                {hydratedCourseStates.map(({ enrollment, state }) => (
                  <article key={enrollment.id} className="rounded-[30px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)] shadow-[0_20px_40px_rgba(10,11,24,0.22)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-3">
                        <Badge variant={state.nextLockedLesson ? "warning" : "success"}>{state.statusLabel}</Badge>
                        <h3 className="text-4xl leading-none tracking-[-0.04em]">{enrollment.course.title}</h3>
                        <p className="text-sm leading-7 text-[var(--portal-muted)]">{enrollment.course.instructor.name}</p>
                      </div>
                      <span className="rounded-full border border-[var(--portal-border)] px-4 py-2 text-sm text-[var(--portal-muted)]">
                        {state.completionCount} / {state.lessonCount} complete
                      </span>
                    </div>
                    <div className="mt-5 h-2 rounded-full bg-[rgba(255,255,255,0.08)]">
                      <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${state.completionPercent}%` }} />
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {state.nextLesson ? (
                        <Link
                          href={`/learn/${enrollment.course.slug}/${state.nextLesson.slug}`}
                          className="inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                        >
                          {state.completionCount > 0 ? "Continue course" : "Open course"}
                        </Link>
                      ) : null}
                      {!enrollment.course.testimonials.some((testimonial) => testimonial.email === session.user.email) ? (
                        <Link
                          href={`/course/${enrollment.course.slug}#leave-review`}
                          className="inline-flex rounded-full border border-[var(--portal-border)] px-5 py-3 text-sm font-semibold text-[var(--portal-text)] transition hover:bg-[rgba(255,255,255,0.06)]"
                        >
                          Leave review
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
              {courseStates.length === 0 ? (
                <section className="rounded-[32px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-8 text-[var(--portal-text)]">
                  <h2 className="text-4xl leading-none tracking-[-0.04em]">No courses yet.</h2>
                </section>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
