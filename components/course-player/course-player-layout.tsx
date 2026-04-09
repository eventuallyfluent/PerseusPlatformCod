"use client";

import { useEffect, useState } from "react";
import type { CourseWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import { StreamableEmbed } from "@/components/ui/streamable-embed";
import { isLessonUnlocked } from "@/lib/courses/lesson-availability";
import { markLessonCompleteAction } from "@/app/(public)/actions";
import { FocusModeButton } from "@/components/course-player/focus-mode-button";
import { HardLink } from "@/components/ui/hard-link";

type CoursePlayerLayoutProps = {
  course: CourseWithRelations;
  activeLessonSlug: string;
  enrolledAt: Date;
  previewMode: boolean;
  completedLessonIds: Set<string>;
  publicPreview?: boolean;
};

type LessonRecord = CourseWithRelations["modules"][number]["lessons"][number] & {
  moduleTitle: string;
  isUnlocked: boolean;
  isCompleted: boolean;
};

function getLessonTypeLabel(lesson: LessonRecord) {
  if (lesson.type === "VIDEO") {
    return "Watch lesson";
  }

  if (lesson.type === "TEXT") {
    return "Read lesson";
  }

  if (lesson.type === "DOWNLOAD") {
    return "Download lesson";
  }

  return "Study lesson";
}

function LessonMedia({ lesson, focus = false }: { lesson: LessonRecord; focus?: boolean }) {
  const supportsVideoSurface = lesson.type === "VIDEO" || lesson.type === "MIXED";

  if (!supportsVideoSurface && !lesson.videoUrl) {
    return null;
  }

  return lesson.videoUrl ? (
    <div className={focus ? "h-full min-h-0" : undefined}>
      <StreamableEmbed url={lesson.videoUrl} title={lesson.title} focus={focus} />
    </div>
  ) : (
    <div
      className={`flex w-full items-center justify-center rounded-[24px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] text-center text-[var(--portal-muted)] ${
        focus ? "min-h-[72svh]" : "aspect-video max-h-[52svh]"
      }`}
    >
      <div className="space-y-2 px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.28em]">Video placeholder</p>
        <p className="text-base leading-7">Video not added yet.</p>
      </div>
    </div>
  );
}

function FocusModeOverlay({
  courseTitle,
  activeLesson,
  onClose,
}: {
  courseTitle: string;
  activeLesson: LessonRecord;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] bg-[rgba(7,8,16,0.96)] px-6 py-6 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--portal-muted)]">{courseTitle}</p>
            <Badge variant="portal">{activeLesson.moduleTitle}</Badge>
            <h1 className="text-3xl leading-[0.96] tracking-[-0.04em] text-white lg:text-[2.9rem]">{activeLesson.title}</h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-white/15 bg-[rgba(255,255,255,0.04)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[rgba(255,255,255,0.1)]"
            onClick={onClose}
          >
            Exit focus mode
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5">
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1">
              <LessonMedia lesson={activeLesson} focus />
            </div>
            {activeLesson.content ? (
              <div className="mt-5 max-w-4xl overflow-y-auto pr-2 text-base leading-8 text-[#ddd5f5]">{activeLesson.content}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CoursePlayerLayout({
  course,
  activeLessonSlug,
  enrolledAt,
  previewMode,
  completedLessonIds,
  publicPreview = false,
}: CoursePlayerLayoutProps) {
  const [focusModeActive, setFocusModeActive] = useState(false);

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

  if (!activeLesson) {
    return <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)]">Lesson not found.</div>;
  }

  if (!activeLesson.isUnlocked) {
    return <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)]">This lesson is not unlocked yet.</div>;
  }

  const activeLessonNumber = activeIndex + 1;
  const modeBadge = publicPreview ? "Public preview" : previewMode ? "Admin preview" : "Enrolled learner";
  const modeCopy = publicPreview
    ? "This preview is watch-only. Completion tracking and member-only resources stay hidden until enrollment."
    : previewMode
      ? "This mirrors the learner experience for review. Progress and completion are not recorded in admin preview."
      : `Lesson ${activeLessonNumber} of ${lessons.length} · ${activeLesson.moduleTitle}`;

  return (
    <>
      <div className="grid gap-6 pb-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:flex lg:h-[calc(100svh-6.25rem)] lg:flex-col lg:overflow-hidden">
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
                    const lessonRecord = {
                      ...lesson,
                      moduleTitle: module.title,
                      isUnlocked: unlocked,
                      isCompleted: completed,
                    };
                    const lessonHref = publicPreview ? `/preview/${course.slug}/${lesson.slug}` : `/learn/${course.slug}/${lesson.slug}`;

                    if (publicPreview && !lesson.isPreview) {
                      return (
                        <div key={lesson.id} className="rounded-[22px] border border-dashed border-[var(--portal-border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-[#877ca7]">
                          <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em]">
                            <span>Members only</span>
                            <span>{lesson.durationLabel ?? "Included"}</span>
                          </span>
                          <span className="mt-1 block font-semibold">{lesson.title}</span>
                        </div>
                      );
                    }

                    if (!unlocked) {
                      return (
                        <div key={lesson.id} className="rounded-[22px] border border-dashed border-[var(--portal-border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-[#877ca7]">
                          <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em]">
                            <span>Locked</span>
                            <span>{lesson.dripDays ?? 0} day drip</span>
                          </span>
                          <span className="mt-1 block font-semibold">{lesson.title}</span>
                        </div>
                      );
                    }

                    const statusLabel = lesson.slug === activeLessonSlug ? "Current" : completed ? "Completed" : publicPreview && lesson.isPreview ? "Preview" : "Open";

                    return (
                      <HardLink
                        key={lesson.id}
                        href={lessonHref}
                        className={`block rounded-[22px] border px-4 py-3 text-sm transition ${
                          lesson.slug === activeLessonSlug
                            ? "border-[rgba(143,44,255,0.45)] bg-[rgba(143,44,255,0.14)] text-white shadow-[0_14px_30px_rgba(28,25,23,0.16)]"
                            : "border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] text-[#d9d1f2] hover:bg-[rgba(255,255,255,0.06)]"
                        }`}
                      >
                        <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em] opacity-70">
                          <span>Lesson {lessonIndex + 1}</span>
                          <span>{statusLabel}</span>
                        </span>
                        <span className="mt-1 block font-semibold">{lesson.title}</span>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] opacity-60">
                          <span>{getLessonTypeLabel(lessonRecord)}</span>
                          {lesson.durationLabel ? <span>{lesson.durationLabel}</span> : null}
                          {lesson.isPreview && !publicPreview ? <span>Preview</span> : null}
                        </div>
                      </HardLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="space-y-6 lg:h-[calc(100svh-6.25rem)]">
          <div className="space-y-5 rounded-[30px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-8 text-[var(--portal-text)] shadow-[0_20px_40px_rgba(10,11,24,0.24)]">
            <div className="space-y-4">
              <div className="rounded-[22px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={publicPreview ? "warning" : previewMode ? "premium" : "success"}>{modeBadge}</Badge>
                  <p className="text-sm leading-7 text-[var(--portal-muted)]">{modeCopy}</p>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--portal-muted)]">{course.title}</p>
                  <Badge variant="portal">{activeLesson.moduleTitle}</Badge>
                  <h1 className="text-3xl leading-[0.96] tracking-[-0.04em] lg:text-[2.7rem]">{activeLesson.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--portal-muted)]">
                    <span>{getLessonTypeLabel(activeLesson)}</span>
                    {activeLesson.durationLabel ? <span>{activeLesson.durationLabel}</span> : null}
                    {!publicPreview && activeLesson.isCompleted ? <span className="text-[#f7d481]">Completed</span> : null}
                  </div>
                </div>
                <FocusModeButton active={focusModeActive} onToggle={() => setFocusModeActive((value) => !value)} />
              </div>
              <div className="space-y-4">
                <LessonMedia lesson={activeLesson} />
              </div>
            </div>
            <div className="space-y-6">
              {activeLesson.content ? <div className="max-w-3xl text-base leading-8 text-[#ddd5f5]">{activeLesson.content}</div> : null}
              {!publicPreview && activeLesson.downloadUrl ? (
                <a className="inline-flex rounded-full border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-5 py-3 text-sm font-semibold text-[#d9d1f2] transition hover:bg-[rgba(255,255,255,0.08)]" href={activeLesson.downloadUrl} target="_blank" rel="noreferrer">
                  Download lesson resource
                </a>
              ) : null}
              {!publicPreview && !previewMode ? (
                <form action={markLessonCompleteAction} className="pt-1 pb-3">
                  <input type="hidden" name="lessonId" value={activeLesson.id} />
                  <input type="hidden" name="courseSlug" value={course.slug} />
                  <input type="hidden" name="lessonSlug" value={activeLesson.slug} />
                  <button
                    className="inline-flex w-full max-w-xs items-center justify-center rounded-full bg-[var(--accent)] px-6 py-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(143,44,255,0.18)] transition hover:bg-[var(--accent-strong)]"
                    type="submit"
                  >
                    {activeLesson.isCompleted ? "Lesson completed" : "Mark as complete"}
                  </button>
                </form>
              ) : null}
              {previewMode && !publicPreview ? (
                <div className="rounded-[20px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.03)] px-5 py-4 text-sm leading-7 text-[var(--portal-muted)]">
                  Admin preview mirrors the learner view, but completion and progress tracking stay disabled here.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {focusModeActive ? <FocusModeOverlay courseTitle={course.title} activeLesson={activeLesson} onClose={() => setFocusModeActive(false)} /> : null}
    </>
  );
}
