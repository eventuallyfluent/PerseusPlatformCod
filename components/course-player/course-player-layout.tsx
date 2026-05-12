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

function LessonMedia({
  lesson,
  focus = false,
  fallbackUrl,
  emptyMessage,
}: {
  lesson: LessonRecord;
  focus?: boolean;
  fallbackUrl?: string | null;
  emptyMessage?: string | null;
}) {
  const mediaUrl = lesson.videoUrl || fallbackUrl;

  if (!mediaUrl) {
    if (!emptyMessage) {
      return null;
    }

    return (
      <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--surface-panel-strong)] px-5 py-4 text-sm leading-7 text-[var(--text-secondary)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={focus ? "h-full min-h-0" : "overflow-hidden rounded-[22px] bg-black"}>
      <StreamableEmbed url={mediaUrl} title={lesson.title} focus={focus} />
    </div>
  );
}

function LessonStateDot({ lesson, active }: { lesson: LessonRecord; active: boolean }) {
  const label = active ? "Current lesson" : lesson.isCompleted ? "Completed lesson" : lesson.isPreview ? "Preview lesson" : "Available lesson";

  return (
    <span
      aria-label={label}
      className={`mt-1 inline-flex size-2.5 shrink-0 rounded-full ${
        active
          ? "bg-[var(--accent-lavender)] shadow-[0_0_0_4px_var(--accent-soft)]"
          : lesson.isCompleted
            ? "bg-[var(--premium)]"
            : lesson.isPreview
              ? "bg-[var(--success)]"
              : "bg-[var(--text-muted)]"
      }`}
    />
  );
}

function FocusModeOverlay({
  courseTitle,
  activeLesson,
  fallbackUrl,
  emptyMessage,
  onClose,
}: {
  courseTitle: string;
  activeLesson: LessonRecord;
  fallbackUrl?: string | null;
  emptyMessage?: string | null;
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
    <div className="fixed inset-0 z-[80] bg-[var(--focus-overlay-backdrop)] px-6 py-6 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--portal-muted)]">{courseTitle}</p>
            <Badge variant="portal">{activeLesson.moduleTitle}</Badge>
            <h1 className="text-3xl leading-[0.96] tracking-[-0.04em] text-[var(--focus-overlay-text)] lg:text-[2.9rem]">{activeLesson.title}</h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-full border border-[var(--focus-overlay-button-border)] bg-[var(--focus-overlay-button-background)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--focus-overlay-text)] transition hover:bg-[var(--focus-overlay-button-hover)]"
            onClick={onClose}
          >
            Exit focus mode
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-[32px] border border-[var(--focus-overlay-panel-border)] bg-[var(--focus-overlay-panel-background)] p-5">
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1">
              <LessonMedia lesson={activeLesson} focus fallbackUrl={fallbackUrl} emptyMessage={emptyMessage} />
            </div>
            {activeLesson.content ? (
              <div className="mt-5 max-w-4xl overflow-y-auto pr-2 text-base leading-8 text-[var(--focus-overlay-muted)]">{activeLesson.content}</div>
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

  const sortedModules = course.modules
    .slice()
    .sort((left, right) => left.position - right.position)
    .map((module) => ({
      ...module,
      lessons: module.lessons.slice().sort((left, right) => left.position - right.position),
    }));

  const lessons = sortedModules.flatMap((module) =>
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
  const previousLesson = lessons.slice(0, activeIndex).reverse().find((lesson) => lesson.isUnlocked && (!publicPreview || lesson.isPreview)) ?? null;
  const nextLesson = lessons.slice(activeIndex + 1).find((lesson) => lesson.isUnlocked && (!publicPreview || lesson.isPreview)) ?? null;
  const previewFallbackVideoUrl = publicPreview && activeLesson?.isPreview ? course.salesVideoUrl : null;
  const lessonVideoMissingMessage =
    publicPreview && activeLesson?.type === "VIDEO" && !activeLesson.videoUrl
      ? previewFallbackVideoUrl
        ? "This preview is using the course sales video because the lesson video has not been added yet."
        : "This preview lesson is marked as video, but no lesson video has been added yet."
      : null;

  if (!activeLesson) {
    return <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)]">Lesson not found.</div>;
  }

  if (!activeLesson.isUnlocked) {
    return <div className="rounded-[28px] border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 text-[var(--portal-text)]">This lesson is not unlocked yet.</div>;
  }

  const completionCount = lessons.filter((lesson) => lesson.isCompleted).length;
  const progressPercent = lessons.length > 0 ? Math.round((completionCount / lessons.length) * 100) : 0;
  const lessonHref = (lesson: LessonRecord) => publicPreview ? `/preview/${course.slug}/${lesson.slug}` : `/learn/${course.slug}/${lesson.slug}`;

  return (
    <>
      <div className="perseus-player-shell grid gap-4 pb-4 lg:h-[calc(100svh-7rem)] lg:min-h-0 lg:grid-cols-[320px_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="perseus-player-sidebar min-h-0 lg:flex lg:flex-col lg:overflow-hidden">
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-[var(--shadow-panel)] lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <div className="space-y-4 border-b border-[var(--border)] p-4 sm:p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--portal-muted)]">Course curriculum</p>
                <h2 className="mt-2 line-clamp-2 text-xl leading-tight tracking-[-0.02em]">{course.title}</h2>
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--portal-muted)]">
                  <span>{completionCount} / {lessons.length} complete</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-panel-strong)]">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--premium))]" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
            <div className="space-y-5 p-4 sm:p-5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {sortedModules.map((module, moduleIndex) => (
              <div key={module.id} className="space-y-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--portal-muted)]">Module {moduleIndex + 1}</p>
                  <h3 className="mt-1 text-base font-semibold leading-tight">{module.title}</h3>
                </div>
                <div className="space-y-2">
                  {module.lessons.map((lesson) => {
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
                        <div key={lesson.id} className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--surface-panel-strong)] px-3 py-2.5 text-sm text-[var(--text-muted)]">
                          <span className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.2em]">
                            <span>Members only</span>
                            <span>{lesson.durationLabel ?? "Included"}</span>
                          </span>
                          <span className="mt-1 block font-semibold">{lesson.title}</span>
                        </div>
                      );
                    }

                    if (!unlocked) {
                      return (
                        <div key={lesson.id} className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--surface-panel-strong)] px-3 py-2.5 text-sm text-[var(--text-muted)]">
                          <span className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.2em]">
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
                        className={`grid grid-cols-[14px_minmax(0,1fr)] gap-3 rounded-[18px] border px-3 py-2.5 text-sm transition ${
                          lesson.slug === activeLessonSlug
                            ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)] shadow-[var(--shadow-brand)]"
                            : "border-[var(--border)] bg-[var(--surface-panel-strong)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <LessonStateDot lesson={lessonRecord} active={lesson.slug === activeLessonSlug} />
                        <div className="min-w-0">
                          <span className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.2em] opacity-70">
                            <span className="truncate">{getLessonTypeLabel(lessonRecord)}</span>
                            <span className="shrink-0">{statusLabel}</span>
                          </span>
                          <span className="mt-1 block font-semibold leading-snug">{lesson.title}</span>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] opacity-60">
                            {lesson.durationLabel ? <span>{lesson.durationLabel}</span> : null}
                            {lesson.isPreview && !publicPreview ? <span>Preview</span> : null}
                          </div>
                        </div>
                      </HardLink>
                    );
                  })}
                </div>
              </div>
            ))}
            </div>
          </div>
        </aside>

        <main className="perseus-player-main min-h-0 lg:h-full">
          <div className="perseus-player-panel flex min-h-0 flex-col rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] text-[var(--text-primary)] shadow-[var(--shadow-panel)] lg:h-full lg:overflow-hidden">
            <div className="grid min-h-0 gap-4 p-4 sm:p-5 lg:flex lg:flex-1 lg:grid-cols-none lg:flex-col lg:overflow-hidden">
              <div className="min-h-0 lg:flex-none">
                <LessonMedia
                  lesson={activeLesson}
                  fallbackUrl={previewFallbackVideoUrl}
                  emptyMessage={lessonVideoMissingMessage}
                />
              </div>
              <div className="grid min-h-0 gap-4 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_260px] lg:overflow-hidden xl:grid-cols-[minmax(0,1fr)_300px]">
                <section className="min-w-0 space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--portal-muted)]">{course.title}</p>
                      <Badge variant="portal">{activeLesson.moduleTitle}</Badge>
                      <h1 className="break-words text-3xl leading-[0.98] tracking-[-0.035em] lg:text-[2.35rem]">{activeLesson.title}</h1>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--portal-muted)]">
                        <span>{getLessonTypeLabel(activeLesson)}</span>
                        {activeLesson.durationLabel ? <span>{activeLesson.durationLabel}</span> : null}
                        {!publicPreview && activeLesson.isCompleted ? <span className="text-[var(--premium)]">Completed</span> : null}
                      </div>
                    </div>
                    <FocusModeButton active={focusModeActive} onToggle={() => setFocusModeActive((value) => !value)} />
                  </div>
                  {activeLesson.content ? <div className="max-w-3xl whitespace-pre-wrap text-base leading-8 text-[var(--text-secondary)]">{activeLesson.content}</div> : null}
                </section>
                <aside className="space-y-3 rounded-[20px] border border-[var(--border)] bg-[var(--surface-panel-strong)] p-4 lg:self-start">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--portal-muted)]">Lesson actions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {previousLesson ? (
                      <HardLink href={lessonHref(previousLesson)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-center text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)]">
                        Previous
                      </HardLink>
                    ) : (
                      <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] opacity-60">Previous</span>
                    )}
                    {nextLesson ? (
                      <HardLink href={lessonHref(nextLesson)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-center text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)]">
                        Next
                      </HardLink>
                    ) : (
                      <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] opacity-60">Next</span>
                    )}
                  </div>
                  {!publicPreview && activeLesson.downloadUrl ? (
                    <a className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-2 text-center text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel-strong)]" href={activeLesson.downloadUrl} target="_blank" rel="noreferrer">
                      Download resource
                    </a>
                  ) : null}
                  {!publicPreview ? (
                    <form action={markLessonCompleteAction}>
                      <input type="hidden" name="lessonId" value={activeLesson.id} />
                      <input type="hidden" name="courseSlug" value={course.slug} />
                      <input type="hidden" name="lessonSlug" value={activeLesson.slug} />
                      <button
                        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--button-primary-background)] px-5 py-3 text-center text-sm font-semibold text-white shadow-[var(--button-primary-shadow)] transition hover:bg-[var(--button-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                        type="submit"
                        disabled={previewMode}
                      >
                        {activeLesson.isCompleted ? "Lesson completed" : "Mark as complete"}
                      </button>
                    </form>
                  ) : null}
                </aside>
              </div>
            </div>
          </div>
        </main>
      </div>

      {focusModeActive ? (
        <FocusModeOverlay
          courseTitle={course.title}
          activeLesson={activeLesson}
          fallbackUrl={previewFallbackVideoUrl}
          emptyMessage={lessonVideoMissingMessage}
          onClose={() => setFocusModeActive(false)}
        />
      ) : null}
    </>
  );
}
