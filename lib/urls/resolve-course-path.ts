import type { Course } from "@prisma/client";

export function resolveCoursePublicPath(course: Pick<Course, "slug" | "publicPath" | "legacyUrl">) {
  if (course.publicPath && course.publicPath.startsWith("/")) {
    return course.publicPath;
  }

  if (course.legacyUrl && course.legacyUrl.startsWith("/")) {
    return course.legacyUrl;
  }

  return `/course/${course.slug}`;
}
