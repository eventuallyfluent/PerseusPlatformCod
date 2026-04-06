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
    state: getDashboardCourseState(enrollment.course, enrollment.enrolledAt),
  }));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(143,44,255,0.08),transparent_18%),linear-gradient(180deg,#0d0f1d,#13152a_34%,#0c0e1d_100%)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="space-y-8">
          <section className="space-y-2">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-lavender)]">Learner dashboard</p>
              <h1 className="text-5xl leading-none tracking-[-0.05em] text-white">Your library</h1>
              <p className="text-base leading-8 text-[var(--portal-muted)]">Open any course you own and continue from its next available lesson.</p>
            </div>
          </section>

          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel-strong)] p-6 text-[var(--portal-text)]">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--portal-muted)]">Owned courses</p>
                <p className="mt-3 text-4xl">{courseStates.length}</p>
              </div>
              <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel-strong)] p-6 text-[var(--portal-text)]">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--portal-muted)]">Ready now</p>
                <p className="mt-3 text-4xl">{courseStates.reduce((sum, item) => sum + item.state.unlockedCount, 0)}</p>
              </div>
              <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel-strong)] p-6 text-[var(--portal-text)]">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--portal-muted)]">On drip</p>
                <p className="mt-3 text-4xl">{courseStates.filter((item) => item.state.nextLockedLesson).length}</p>
              </div>
            </section>

            <section className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                {courseStates.map(({ enrollment, state }) => (
                  <article key={enrollment.id} className="rounded-[30px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)] shadow-[0_20px_40px_rgba(10,11,24,0.22)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-3">
                        <Badge variant={state.nextLockedLesson ? "warning" : "success"}>{state.statusLabel}</Badge>
                        <h3 className="text-4xl leading-none tracking-[-0.04em]">{enrollment.course.title}</h3>
                      </div>
                      <span className="rounded-full border border-[var(--portal-border)] px-4 py-2 text-sm text-[var(--portal-muted)]">
                        {state.unlockedCount} / {state.lessonCount} open
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-8 text-[var(--portal-muted)]">{enrollment.course.shortDescription}</p>
                    <div className="mt-5 h-2 rounded-full bg-[rgba(255,255,255,0.08)]">
                      <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${state.completionPercent}%` }} />
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--portal-muted)]">Next lesson</p>
                        <p className="mt-2 text-sm font-semibold">{state.nextLesson?.title ?? "No lesson available yet"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--portal-muted)]">Next lock</p>
                        <p className="mt-2 text-sm font-semibold">{state.nextLockedLesson?.title ?? "Fully open"}</p>
                      </div>
                    </div>
                    {state.nextLesson ? (
                      <Link
                        href={`/learn/${enrollment.course.slug}/${state.nextLesson.slug}`}
                        className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                      >
                        Open course
                      </Link>
                    ) : null}
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
