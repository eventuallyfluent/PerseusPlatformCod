import type { CourseWithRelations, GeneratedSalesPagePayload } from "@/types";
import { generateSalesPagePayload } from "@/lib/sales-pages/generate-sales-page-payload";

export function getCourseSalesPage(course: CourseWithRelations): GeneratedSalesPagePayload {
  const salesPage = course.pages.find((page) => page.pageType === "sales");

  if (salesPage?.isOverrideActive && salesPage.overridePayload) {
    const overridePayload = salesPage.overridePayload as Partial<GeneratedSalesPagePayload>;

    if (overridePayload.version === "v2") {
      return overridePayload as GeneratedSalesPagePayload;
    }
  }

  if (salesPage?.generatedPayload) {
    const generatedPayload = salesPage.generatedPayload as Partial<GeneratedSalesPagePayload>;

    if (generatedPayload.version === "v2") {
      return generatedPayload as GeneratedSalesPagePayload;
    }
  }

  return generateSalesPagePayload(course);
}
