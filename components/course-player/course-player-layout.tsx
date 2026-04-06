import Link from "next/link";
import type { CourseWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { StreamableEmbed } from "@/components/ui/streamable-embed";
import { isLessonUnlocked } from "@/lib/courses/lesson-availability";

type CoursePlayerLayoutProps = {
  course: CourseWithRelations;
  activeLessonSlug: string;
  enrolledAt: Date;
};

export function CoursePlayerLayout({ course, activeLessonSlug, enrolledAt }: CoursePlayerLayoutProps) {
  const lessons = course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleTitle: module.title,
      isUnlocked: isLessonUnlocked({
        enrolledAt,
        dripDays: lesson.dripDays,
      }),
    })),
  );

  const activeIndex = lessons.findIndex((lesson) => lesson.slug === activeLessonSlug);
  const activeLesson = lessons[activeIndex];
  const previousLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;
  const progressPercent = lessons.length > 0 ? Math.round(((activeIndex + 1) / lessons.length) * 100) : 0;

  if (!activeLesson) {
    return <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)]">Lesson not found.</div>;
  }

  if (!activeLesson.isUnlocked) {
    return <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)]">This lesson is not unlocked yet.</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6 lg:h-[calc(100svh-7.5rem)] lg:overflow-hidden">
        <div className="space-y-4 rounded-[30px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-8 text-[var(--portal-text)] shadow-[0_20px_40px_rgba(10,11,24,0.24)] lg:h-full lg:flex lg:flex-col">
          <div className="space-y-3">
            <Badge variant="portal">{activeLesson.moduleTitle}</Badge>
            <h1 className="text-5xl leading-none tracking-[-0.04em]">{activeLesson.title}</h1>
            {activeLesson.durationLabel ? <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--portal-muted)]">{activeLesson.durationLabel}</p> : null}
          </div>
          {activeLesson.videoUrl ? <StreamableEmbed url={activeLesson.videoUrl} title={activeLesson.title} /> : null}
          <div className="space-y-6 lg:flex-1 lg:overflow-y-auto lg:pr-2">
            {activeLesson.content ? <div className="max-w-3xl text-base leading-8 text-[#ddd5f5]">{activeLesson.content}</div> : null}
            {activeLesson.downloadUrl ? (
              <a className="inline-flex rounded-full border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-5 py-3 text-sm font-semibold text-[#d9d1f2] transition hover:bg-[rgba(255,255,255,0.08)]" href={activeLesson.downloadUrl} target="_blank" rel="noreferrer">
                Download lesson resource
              </a>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-[28px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] p-6 text-[var(--portal-text)]">
                <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--portal-muted)]">Previous lesson</p>
                {previousLesson ? (
                  <Link href={`/learn/${course.slug}/${previousLesson.slug}`} className="text-2xl leading-none tracking-[-0.03em] underline-offset-4 hover:underline">
                    {previousLesson.title}
                  </Link>
                ) : (
                  <p className="text-sm leading-7 text-[var(--portal-muted)]">You are at the beginning of the course.</p>
                )}
              </div>
              <div className="space-y-3 rounded-[28px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] p-6 text-[var(--portal-text)]">
                <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--portal-muted)]">Next lesson</p>
                {nextLesson && nextLesson.isUnlocked ? (
                  <Link href={`/learn/${course.slug}/${nextLesson.slug}`} className="text-2xl leading-none tracking-[-0.03em] underline-offset-4 hover:underline">
                    {nextLesson.title}
                  </Link>
                ) : nextLesson ? (
                  <p className="text-sm leading-7 text-[var(--portal-muted)]">Locked for now. The course drip will open it when its release window arrives.</p>
                ) : (
                  <p className="text-sm leading-7 text-[var(--portal-muted)]">You have reached the end of the current curriculum path.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-4 lg:flex lg:h-[calc(100svh-7.5rem)] lg:flex-col lg:overflow-hidden">
        <div className="space-y-4 rounded-[30px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)] shadow-[0_20px_40px_rgba(10,11,24,0.24)]">
          <Badge variant="portal">Course player</Badge>
          <h2 className="text-4xl leading-none tracking-[-0.04em]">{course.title}</h2>
          <p className="text-sm leading-7 text-[var(--portal-muted)]">{course.shortDescription}</p>
          <div className="rounded-[22px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-[#d7cff1]">
            Lesson {activeIndex + 1} of {lessons.length}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-[var(--portal-muted)]">
              <span>Path progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(255,255,255,0.08)]">
              <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-5 rounded-[30px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)] shadow-[0_20px_40px_rgba(10,11,24,0.24)] lg:flex-1 lg:overflow-y-auto">
          {course.modules.map((module, moduleIndex) => (
            <div key={module.id} className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--portal-muted)]">Module {moduleIndex + 1}</p>
                <h3 className="mt-2 text-2xl leading-none tracking-[-0.03em]">{module.title}</h3>
              </div>
              <div className="space-y-2">
                {module.lessons.map((lesson, lessonIndex) => {
                  const unlocked = isLessonUnlocked({ enrolledAt, dripDays: lesson.dripDays });

                  return unlocked ? (
                    <Link
                      key={lesson.id}
                      href={`/learn/${course.slug}/${lesson.slug}`}
                      className={`block rounded-[22px] border px-4 py-3 text-sm transition ${
                        lesson.slug === activeLessonSlug
                          ? "border-[rgba(143,44,255,0.45)] bg-[rgba(143,44,255,0.14)] text-white shadow-[0_14px_30px_rgba(28,25,23,0.16)]"
                          : "border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] text-[#d9d1f2] hover:bg-[rgba(255,255,255,0.06)]"
                      }`}
                    >
                      <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em] opacity-70">
                        <span>Lesson {lessonIndex + 1}</span>
                        <span>{lesson.durationLabel ?? "Open"}</span>
                      </span>
                      <span className="mt-1 block font-semibold">{lesson.title}</span>
                    </Link>
                  ) : (
                    <div key={lesson.id} className="rounded-[22px] border border-dashed border-[var(--portal-border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-[#877ca7]">
                      <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em]">
                        <span>Locked</span>
                        <span>{lesson.dripDays ?? 0} day drip</span>
                      </span>
                      <span className="mt-1 block font-semibold">{lesson.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
