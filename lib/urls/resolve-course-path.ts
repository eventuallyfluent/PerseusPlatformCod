import type { Course } from "@prisma/client";
import { normalizePublicPathInput } from "@/lib/urls/normalize-public-path";

export function resolveCoursePublicPath(course: Pick<Course, "slug" | "publicPath" | "legacyUrl">) {
  const publicPath = normalizePublicPathInput(course.publicPath);
  if (publicPath) {
    return publicPath;
  }

  const legacyUrl = normalizePublicPathInput(course.legacyUrl);
  if (legacyUrl) {
    return legacyUrl;
  }

  return `/course/${course.slug}`;
}

export function resolveCourseThankYouPath(course: Pick<Course, "slug" | "publicPath" | "legacyUrl">) {
  return `${resolveCoursePublicPath(course)}/purchased`;
}
