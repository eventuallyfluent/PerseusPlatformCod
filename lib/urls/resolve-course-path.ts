import type { Course } from "@prisma/client";

export function resolveCoursePublicPath(course: Pick<Course, "slug" | "publicPath" | "legacyUrl">) {
  return course.publicPath ?? course.legacyUrl ?? `/course/${course.slug}`;
}
