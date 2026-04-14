import { parseSalesPageConfig } from "@/lib/sales-pages/sales-page-config";
import { resolveCourseThankYouPath } from "@/lib/urls/resolve-course-path";
import type { CourseWithRelations, ProductThankYouPagePayload } from "@/types";

export function generateCourseThankYouPagePayload(course: CourseWithRelations): ProductThankYouPagePayload {
  const config = parseSalesPageConfig(course.salesPageConfig);
  const lessonCount = course.modules.reduce((count, module) => count + module.lessons.length, 0);

  return {
    version: "v1",
    productType: "course",
    eyebrow: config.thankYouEyebrow || "Purchase confirmed",
    headline: config.thankYouHeadline || "You are in. Your course is ready.",
    body:
      config.thankYouBody ||
      "Your purchase is complete. Use the learner dashboard to enter the course and continue through the curriculum at your pace.",
    productTitle: course.title,
    productSubtitle: course.subtitle,
    imageUrl: course.heroImageUrl,
    summaryLabel: "Course access",
    summaryValue: `${lessonCount} lesson${lessonCount === 1 ? "" : "s"} across ${course.modules.length} module${course.modules.length === 1 ? "" : "s"}`,
    items: course.modules.map((module) => ({
      title: module.title,
      subtitle: `${module.lessons.length} lesson${module.lessons.length === 1 ? "" : "s"}`,
    })),
    signedInActionLabel: config.thankYouSignedInLabel || "Continue learning",
    signedOutActionLabel: config.thankYouSignedOutLabel || "Student login",
  };
}

export function getCourseThankYouPagePath(course: CourseWithRelations) {
  return resolveCourseThankYouPath(course);
}
