import { isLessonUnlocked } from "@/lib/courses/lesson-availability";
import type { CourseWithRelations } from "@/types";

export function getDashboardCourseState(course: CourseWithRelations, enrolledAt: Date, completedLessonIds: Set<string>) {
  const lessons = course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleTitle: module.title,
      unlocked: isLessonUnlocked({
        enrolledAt,
        dripDays: lesson.dripDays,
      }),
      completed: completedLessonIds.has(lesson.id),
    })),
  );

  const unlockedLessons = lessons.filter((lesson) => lesson.unlocked);
  const nextLockedLesson = lessons.find((lesson) => !lesson.unlocked) ?? null;
  const nextLesson = lessons.find((lesson) => lesson.unlocked && !lesson.completed) ?? unlockedLessons[0] ?? null;
  const completedLessons = lessons.filter((lesson) => lesson.completed);

  return {
    lessonCount: lessons.length,
    unlockedCount: unlockedLessons.length,
    completionCount: completedLessons.length,
    completionPercent: lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0,
    nextLesson,
    nextLockedLesson,
    statusLabel:
      completedLessons.length === lessons.length && lessons.length > 0
        ? "Completed"
        : completedLessons.length > 0
          ? "In progress"
          : unlockedLessons.length > 0
            ? "Ready to begin"
            : "On drip",
  };
}
