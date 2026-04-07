import { prisma } from "@/lib/db/prisma";
import { persistGeneratedPage } from "@/lib/sales-pages/persist-generated-page";
import { courseInputSchema } from "@/lib/zod/schemas";
import { courseInclude } from "@/lib/courses/course-query";
import { validatePublicPathAvailability } from "@/lib/urls/validate-public-path";
import { syncProductOffer } from "@/lib/offers/sync-product-offer";

export async function updateCourse(courseId: string, input: unknown) {
  const data = courseInputSchema.partial().parse(input);
  const existing = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true, legacyUrl: true, publicPath: true },
  });

  if (!existing) {
    throw new Error("Course not found");
  }

  const slug = data.slug ?? existing.slug;
  const desiredPath =
    data.legacyUrl === undefined
      ? (existing.publicPath?.startsWith("/") ? existing.publicPath : `/course/${slug}`)
      : data.legacyUrl?.startsWith("/")
        ? data.legacyUrl
        : `/course/${slug}`;

  const isAvailable = await validatePublicPathAvailability(desiredPath, courseId);
  if (!isAvailable) {
    throw new Error(`Public path collision detected for ${desiredPath}`);
  }

  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      ...data,
      publicPath: desiredPath,
      heroImageUrl: data.heroImageUrl === "" ? null : data.heroImageUrl,
      salesVideoUrl: data.salesVideoUrl === "" ? null : data.salesVideoUrl,
    },
    include: courseInclude,
  });

  await syncProductOffer({
    courseId: course.id,
    title: course.title,
    price: course.price.toString(),
    currency: course.currency,
    compareAtPrice: course.compareAtPrice?.toString() ?? null,
    status: course.status,
  });

  await persistGeneratedPage(course);
  return course;
}
