import { prisma } from "@/lib/db/prisma";
import { generateSalesPagePayload, getSalesPagePath } from "@/lib/sales-pages/generate-sales-page-payload";
import { generateCourseThankYouPagePayload, getCourseThankYouPagePath } from "@/lib/sales-pages/generate-course-thank-you-page-payload";
import type { CourseWithRelations } from "@/types";

export async function persistGeneratedPage(course: CourseWithRelations, force = false) {
  const existingSalesPage = course.pages.find((page) => page.pageType === "sales");
  const existingThankYouPage = course.pages.find((page) => page.pageType === "thank-you");

  if (existingSalesPage?.isOverrideActive && existingThankYouPage?.isOverrideActive && !force) {
    return existingSalesPage;
  }

  const salesPayload = generateSalesPagePayload(course);
  const thankYouPayload = generateCourseThankYouPagePayload(course);
  const salesPath = getSalesPagePath(course);
  const thankYouPath = getCourseThankYouPagePath(course);

  const [salesPage] = await prisma.$transaction([
    existingSalesPage && !(existingSalesPage.isOverrideActive && !force)
      ? prisma.generatedPage.update({
          where: { id: existingSalesPage.id },
          data: {
            generatedPayload: salesPayload,
            templateVersion: "v2",
            pageType: "sales",
            path: salesPath,
          },
        })
      : existingSalesPage
        ? prisma.generatedPage.findUniqueOrThrow({
            where: { id: existingSalesPage.id },
          })
        : prisma.generatedPage.create({
            data: {
              courseId: course.id,
              pageType: "sales",
              path: salesPath,
              templateVersion: "v2",
              generatedPayload: salesPayload,
            },
          }),
    existingThankYouPage && !(existingThankYouPage.isOverrideActive && !force)
      ? prisma.generatedPage.update({
          where: { id: existingThankYouPage.id },
          data: {
            generatedPayload: thankYouPayload,
            templateVersion: "v1",
            pageType: "thank-you",
            path: thankYouPath,
          },
        })
      : existingThankYouPage
        ? prisma.generatedPage.findUniqueOrThrow({
            where: { id: existingThankYouPage.id },
          })
        : prisma.generatedPage.create({
            data: {
              courseId: course.id,
              pageType: "thank-you",
              path: thankYouPath,
              templateVersion: "v1",
              generatedPayload: thankYouPayload,
            },
          }),
  ]);

  return salesPage;
}
