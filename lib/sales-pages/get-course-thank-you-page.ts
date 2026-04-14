import type { CourseWithRelations, ProductThankYouPagePayload } from "@/types";
import { generateCourseThankYouPagePayload } from "@/lib/sales-pages/generate-course-thank-you-page-payload";

export function getCourseThankYouPage(course: CourseWithRelations): ProductThankYouPagePayload {
  const thankYouPage = course.pages.find((page) => page.pageType === "thank-you");

  if (thankYouPage?.isOverrideActive && thankYouPage.overridePayload) {
    const overridePayload = thankYouPage.overridePayload as Partial<ProductThankYouPagePayload>;

    if (overridePayload.version === "v1") {
      return overridePayload as ProductThankYouPagePayload;
    }
  }

  return generateCourseThankYouPagePayload(course);
}
