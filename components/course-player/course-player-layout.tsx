import Link from "next/link";
import type { CourseWithRelations } from "@/types";
import { Card } from "@/components/ui/card";
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
    return <Card>Lesson not found.</Card>;
  }

  if (!activeLesson.isUnlocked) {
    return <Card>This lesson is not unlocked yet.</Card>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="space-y-4 bg-[linear-gradient(135deg,#171412,#2b2018)] text-stone-50">
          <p className="text-[11px] uppercase tracking-[0.34em] text-[rgba(255,237,208,0.68)]">Course player</p>
          <h2 className="text-4xl leading-none tracking-[-0.04em]">{course.title}</h2>
          <p className="text-sm leading-7 text-[rgba(255,245,232,0.76)]">{course.shortDescription}</p>
          <div className="rounded-[22px] border border-[rgba(255,245,232,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-[rgba(255,245,232,0.78)]">
            Lesson {activeIndex + 1} of {lessons.length}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-[rgba(255,237,208,0.68)]">
              <span>Path progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-[rgba(255,255,255,0.12)]">
              <div className="h-2 rounded-full bg-[var(--accent)]" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          {course.modules.map((module, moduleIndex) => (
            <div key={module.id} className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Module {moduleIndex + 1}</p>
                <h3 className="mt-2 text-2xl leading-none tracking-[-0.03em] text-stone-950">{module.title}</h3>
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
                          ? "border-stone-950 bg-stone-950 text-stone-50 shadow-[0_14px_30px_rgba(28,25,23,0.16)]"
                          : "border-[var(--border)] bg-white/65 text-stone-700 hover:bg-white"
                      }`}
                    >
                      <span className="flex items-center justify-between text-[11px] uppercase tracking-[0.24em] opacity-60">
                        <span>Lesson {lessonIndex + 1}</span>
                        <span>{lesson.durationLabel ?? "Open"}</span>
                      </span>
                      <span className="mt-1 block font-semibold">{lesson.title}</span>
                    </Link>
                  ) : (
                    <div key={lesson.id} className="rounded-[22px] border border-dashed border-[var(--border)] bg-stone-100/70 px-4 py-3 text-sm text-stone-400">
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
        </Card>
      </aside>

      <div className="space-y-6">
        <Card className="space-y-6 p-8">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">{activeLesson.moduleTitle}</p>
            <h1 className="text-5xl leading-none tracking-[-0.04em] text-stone-950">{activeLesson.title}</h1>
            {activeLesson.durationLabel ? <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">{activeLesson.durationLabel}</p> : null}
          </div>
          {activeLesson.videoUrl ? <StreamableEmbed url={activeLesson.videoUrl} title={activeLesson.title} /> : null}
          {activeLesson.content ? <div className="max-w-3xl text-base leading-8 text-stone-700">{activeLesson.content}</div> : null}
          {activeLesson.downloadUrl ? (
            <a className="inline-flex rounded-full border border-[var(--border-strong)] px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-white/70" href={activeLesson.downloadUrl} target="_blank" rel="noreferrer">
              Download lesson resource
            </a>
          ) : null}
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Previous lesson</p>
            {previousLesson ? (
              <Link href={`/learn/${course.slug}/${previousLesson.slug}`} className="text-2xl leading-none tracking-[-0.03em] text-stone-950 underline-offset-4 hover:underline">
                {previousLesson.title}
              </Link>
            ) : (
              <p className="text-sm leading-7 text-stone-500">You are at the beginning of the course.</p>
            )}
          </Card>
          <Card className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.34em] text-stone-500">Next lesson</p>
            {nextLesson && nextLesson.isUnlocked ? (
              <Link href={`/learn/${course.slug}/${nextLesson.slug}`} className="text-2xl leading-none tracking-[-0.03em] text-stone-950 underline-offset-4 hover:underline">
                {nextLesson.title}
              </Link>
            ) : nextLesson ? (
              <p className="text-sm leading-7 text-stone-500">Locked for now. The course drip will open it when its release window arrives.</p>
            ) : (
              <p className="text-sm leading-7 text-stone-500">You have reached the end of the current curriculum path.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
