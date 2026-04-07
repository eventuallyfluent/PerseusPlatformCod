import Link from "next/link";
import type { CourseWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { StreamableEmbed } from "@/components/ui/streamable-embed";
import { isLessonUnlocked } from "@/lib/courses/lesson-availability";
import { markLessonCompleteAction } from "@/app/(public)/actions";
import { FocusModeButton } from "@/components/course-player/focus-mode-button";

type CoursePlayerLayoutProps = {
  course: CourseWithRelations;
  activeLessonSlug: string;
  enrolledAt: Date;
  previewMode: boolean;
  completedLessonIds: Set<string>;
};

export function CoursePlayerLayout({ course, activeLessonSlug, enrolledAt, previewMode, completedLessonIds }: CoursePlayerLayoutProps) {
  const lessons = course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleTitle: module.title,
      isUnlocked: isLessonUnlocked({
        enrolledAt,
        dripDays: lesson.dripDays,
      }),
      isCompleted: completedLessonIds.has(lesson.id),
    })),
  );

  const activeIndex = lessons.findIndex((lesson) => lesson.slug === activeLessonSlug);
  const activeLesson = lessons[activeIndex];
  const playerId = `lesson-player-${activeLessonSlug}`;

  if (!activeLesson) {
    return <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)]">Lesson not found.</div>;
  }

  if (!activeLesson.isUnlocked) {
    return <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)]">This lesson is not unlocked yet.</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-4 lg:flex lg:h-[calc(100svh-7.5rem)] lg:flex-col lg:overflow-hidden">
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
                  const completed = completedLessonIds.has(lesson.id);

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
                      {completed ? <span className="mt-2 inline-flex rounded-full border border-[rgba(212,168,70,0.36)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f7d481]">Completed</span> : null}
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

      <div className="space-y-6 lg:h-[calc(100svh-7.5rem)] lg:overflow-hidden">
        <div className="space-y-6 rounded-[30px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-8 text-[var(--portal-text)] shadow-[0_20px_40px_rgba(10,11,24,0.24)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--portal-muted)]">{course.title}</p>
                <Badge variant="portal">{activeLesson.moduleTitle}</Badge>
                <h1 className="text-5xl leading-none tracking-[-0.04em]">{activeLesson.title}</h1>
                {activeLesson.durationLabel ? <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--portal-muted)]">{activeLesson.durationLabel}</p> : null}
              </div>
              <FocusModeButton targetId={playerId} />
            </div>
            <div id={playerId} className="space-y-4">
              {activeLesson.videoUrl ? (
                <StreamableEmbed url={activeLesson.videoUrl} title={activeLesson.title} />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-[24px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] text-center text-[var(--portal-muted)]">
                  <div className="space-y-2 px-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.28em]">Video placeholder</p>
                    <p className="text-base leading-7">Video not added yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            {activeLesson.content ? <div className="max-w-3xl text-base leading-8 text-[#ddd5f5]">{activeLesson.content}</div> : null}
            {activeLesson.downloadUrl ? (
              <a className="inline-flex rounded-full border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-5 py-3 text-sm font-semibold text-[#d9d1f2] transition hover:bg-[rgba(255,255,255,0.08)]" href={activeLesson.downloadUrl} target="_blank" rel="noreferrer">
                Download lesson resource
              </a>
            ) : null}
            <form action={markLessonCompleteAction} className="pt-2">
              <input type="hidden" name="lessonId" value={activeLesson.id} />
              <input type="hidden" name="courseSlug" value={course.slug} />
              <input type="hidden" name="lessonSlug" value={activeLesson.slug} />
              <button
                className="inline-flex w-full max-w-xs items-center justify-center rounded-full bg-[var(--accent)] px-6 py-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(143,44,255,0.18)] transition hover:bg-[var(--accent-strong)]"
                type="submit"
                disabled={previewMode}
              >
                {previewMode ? "Preview mode" : activeLesson.isCompleted ? "Marked complete" : "Mark as complete"}
              </button>
              {previewMode ? <p className="mt-3 text-sm leading-7 text-[var(--portal-muted)]">Preview mode shows the learner layout without changing course progress.</p> : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
