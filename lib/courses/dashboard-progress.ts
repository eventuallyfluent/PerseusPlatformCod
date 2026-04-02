import { isLessonUnlocked } from "@/lib/courses/lesson-availability";
import type { CourseWithRelations } from "@/types";

export function getDashboardCourseState(course: CourseWithRelations, enrolledAt: Date) {
  const lessons = course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleTitle: module.title,
      unlocked: isLessonUnlocked({
        enrolledAt,
        dripDays: lesson.dripDays,
      }),
    })),
  );

  const unlockedLessons = lessons.filter((lesson) => lesson.unlocked);
  const nextLockedLesson = lessons.find((lesson) => !lesson.unlocked) ?? null;
  const nextLesson = unlockedLessons[0] ?? null;

  return {
    lessonCount: lessons.length,
    unlockedCount: unlockedLessons.length,
    completionPercent: lessons.length > 0 ? Math.round((unlockedLessons.length / lessons.length) * 100) : 0,
    nextLesson,
    nextLockedLesson,
    statusLabel: unlockedLessons.length <= 1 ? "Ready to begin" : unlockedLessons.length === lessons.length ? "Fully open" : "Open for study",
  };
}
