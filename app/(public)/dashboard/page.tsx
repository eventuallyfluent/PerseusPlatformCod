import Link from "next/link";
import { requireSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getDashboardCourseState } from "@/lib/courses/dashboard-progress";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(143,44,255,0.08),transparent_18%),linear-gradient(180deg,#0d0f1d,#13152a_34%,#0c0e1d_100%)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <LearnerContextBar
          title="Your courses"
          description="Pick up where you left off."
          identity={session.user.name ?? session.user.email!}
          primaryHref={spotlight?.state.nextLesson ? `/learn/${spotlight.enrollment.course.slug}/${spotlight.state.nextLesson.slug}` : undefined}
          primaryLabel={spotlight?.state.nextLesson ? "Continue" : undefined}
          secondaryHref="/"
          secondaryLabel="Browse courses"
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-[32px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)] shadow-[0_22px_48px_rgba(10,11,24,0.24)]">
            <div className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--portal-muted)]">Perseus</p>
                <h2 className="mt-3 text-3xl leading-none tracking-[-0.04em]">Study portal</h2>
              </div>
              <div className="rounded-[24px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
                <p className="text-sm font-semibold">{session.user.name ?? session.user.email!}</p>
                <p className="mt-1 text-sm text-[var(--portal-muted)]">Learner</p>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <div className="rounded-[18px] bg-[rgba(143,44,255,0.14)] px-4 py-3 text-sm font-semibold text-[#dcc3ff]">Dashboard</div>
              <div className="rounded-[18px] px-4 py-3 text-sm text-[var(--portal-muted)]">My Courses</div>
              <div className="rounded-[18px] px-4 py-3 text-sm text-[var(--portal-muted)]">Library</div>
              <div className="rounded-[18px] px-4 py-3 text-sm text-[var(--portal-muted)]">Account</div>
            </div>

            <div className="mt-8 border-t border-[var(--portal-border)] pt-6">
              <div className="flex flex-col gap-3">
                <Link href="/" className="text-sm text-[var(--portal-muted)] transition hover:text-white">
                  Browse courses
                </Link>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel-strong)] p-6 text-[var(--portal-text)]">
                <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--portal-muted)]">Enrollments</p>
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

            {spotlight ? (
              <section className="rounded-[32px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-7 text-[var(--portal-text)] shadow-[0_22px_48px_rgba(10,11,24,0.24)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <Badge variant="portal">Continue learning</Badge>
                    <h2 className="text-5xl leading-none tracking-[-0.05em]">{spotlight.enrollment.course.title}</h2>
                    <p className="max-w-2xl text-base leading-8 text-[var(--portal-muted)]">{spotlight.enrollment.course.shortDescription}</p>
                  </div>
                  <div className="space-y-2 rounded-[24px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-5 py-4">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--portal-muted)]">Status</p>
                    <p className="text-lg font-semibold">{spotlight.state.statusLabel}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--portal-muted)]">Instructor</p>
                    <p className="mt-2 text-base font-semibold">{spotlight.enrollment.course.instructor.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--portal-muted)]">Available now</p>
                    <p className="mt-2 text-base font-semibold">
                      {spotlight.state.unlockedCount} / {spotlight.state.lessonCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--portal-muted)]">Next lesson</p>
                    <p className="mt-2 text-base font-semibold">{spotlight.state.nextLesson?.title ?? "No lesson open yet"}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-[var(--portal-muted)]">
                    <span>Progress</span>
                    <span>{spotlight.state.completionPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)]">
                    <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${spotlight.state.completionPercent}%` }} />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {spotlight.state.nextLesson ? (
                    <Link
                      href={`/learn/${spotlight.enrollment.course.slug}/${spotlight.state.nextLesson.slug}`}
                      className="inline-flex rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                    >
                      Continue
                    </Link>
                  ) : null}
                  <Link
                    href={spotlight.enrollment.course.publicPath ?? spotlight.enrollment.course.legacyUrl ?? `/course/${spotlight.enrollment.course.slug}`}
                    className="inline-flex rounded-full border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-6 py-3 text-sm font-semibold text-[#d9d1f2] transition hover:bg-[rgba(255,255,255,0.08)]"
                  >
                    View course page
                  </Link>
                </div>
              </section>
            ) : (
              <section className="rounded-[32px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-8 text-[var(--portal-text)]">
                <Badge variant="warning">No active enrollments</Badge>
                <h2 className="mt-5 text-4xl leading-none tracking-[-0.04em]">No courses yet.</h2>
              </section>
            )}

            <section className="space-y-6">
              <div className="space-y-3">
                <Badge variant="portal">Course library</Badge>
                <h2 className="text-5xl leading-none tracking-[-0.05em] text-white">Your library</h2>
              </div>
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
                        Continue
                      </Link>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
