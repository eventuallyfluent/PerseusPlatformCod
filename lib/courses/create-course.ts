import { prisma } from "@/lib/db/prisma";
import { courseInputSchema } from "@/lib/zod/schemas";
import { persistGeneratedPage } from "@/lib/sales-pages/persist-generated-page";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
import { validatePublicPathAvailability } from "@/lib/urls/validate-public-path";
import { courseInclude } from "@/lib/courses/course-query";
import { syncProductOffer } from "@/lib/offers/sync-product-offer";
import { syncAccessProduct } from "@/lib/access-products/sync-access-product";

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
      upsellDiscountValue: data.upsellDiscountType === "NONE" ? null : data.upsellDiscountValue ?? null,
      upsellHeadline: data.upsellHeadline || null,
      upsellBody: data.upsellBody || null,
      legacyCourseId: data.legacyCourseId || null,
      legacySlug: data.legacySlug || null,
      legacyUrl: data.legacyUrl || null,
      publicPath: desiredPath,
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

  await syncAccessProduct({
    courseId: course.id,
    slug: course.slug,
    title: `${course.title} access`,
    status: course.status,
    description: course.shortDescription,
    grantedCourseIds: [course.id],
  });

  await persistGeneratedPage(course);
  return { ...course, publicPath: resolveCoursePublicPath(course) };
}
