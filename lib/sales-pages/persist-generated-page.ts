import { prisma } from "@/lib/db/prisma";
import { generateSalesPagePayload, getSalesPagePath } from "@/lib/sales-pages/generate-sales-page-payload";
import type { CourseWithRelations } from "@/types";

export async function persistGeneratedPage(course: CourseWithRelations, force = false) {
  const existing = course.pages.find((page) => page.pageType === "sales");
  const nextPath = getSalesPagePath(course);

  if (existing?.isOverrideActive && !force) {
    return existing;
  }

  if (existing) {
    return prisma.generatedPage.update({
      where: { id: existing.id },
      data: {
        generatedPayload: generateSalesPagePayload(course),
        templateVersion: "v2",
        pageType: "sales",
        path: nextPath,
      },
    });
  }

  return prisma.generatedPage.create({
    data: {
      courseId: course.id,
      pageType: "sales",
      path: nextPath,
      templateVersion: "v2",
      generatedPayload: generateSalesPagePayload(course),
    },
  });
}
