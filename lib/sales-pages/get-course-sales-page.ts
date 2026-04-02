import type { CourseWithRelations, GeneratedSalesPagePayload } from "@/types";
import { generateSalesPagePayload } from "@/lib/sales-pages/generate-sales-page-payload";

export function getCourseSalesPage(course: CourseWithRelations): GeneratedSalesPagePayload {
  const salesPage = course.pages.find((page) => page.pageType === "sales");

  if (salesPage?.isOverrideActive && salesPage.overridePayload) {
    return salesPage.overridePayload as GeneratedSalesPagePayload;
  }

  if (salesPage?.generatedPayload) {
    return salesPage.generatedPayload as GeneratedSalesPagePayload;
  }

  return generateSalesPagePayload(course);
}
