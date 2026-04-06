import { prisma } from "@/lib/db/prisma";
import { courseInputSchema } from "@/lib/zod/schemas";
import { persistGeneratedPage } from "@/lib/sales-pages/persist-generated-page";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { validatePublicPathAvailability } from "@/lib/urls/validate-public-path";
import { courseInclude } from "@/lib/courses/course-query";

export async function createCourse(input: unknown) {
  const data = courseInputSchema.parse(input);
  const desiredPath = data.legacyUrl?.startsWith("/") ? data.legacyUrl : `/course/${data.slug}`;
  const isAvailable = await validatePublicPathAvailability(desiredPath);

  if (!isAvailable) {
    throw new Error(`Public path collision detected for ${desiredPath}`);
  }

  const course = await prisma.course.create({
    data: {
      ...data,
      heroImageUrl: data.heroImageUrl || null,
      salesVideoUrl: data.salesVideoUrl || null,
      legacyUrl: data.legacyUrl || null,
      publicPath: desiredPath,
    },
    include: courseInclude,
  });

  await persistGeneratedPage(course);
  return { ...course, publicPath: resolveCoursePublicPath(course) };
}
