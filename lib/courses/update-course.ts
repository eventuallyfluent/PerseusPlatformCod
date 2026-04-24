import { prisma } from "@/lib/db/prisma";
import { persistGeneratedPage } from "@/lib/sales-pages/persist-generated-page";
import { courseInputSchema } from "@/lib/zod/schemas";
import { courseInclude } from "@/lib/courses/course-query";
import { validatePublicPathAvailability } from "@/lib/urls/validate-public-path";
import { normalizePublicPathInput } from "@/lib/urls/normalize-public-path";
import { syncProductOffer } from "@/lib/offers/sync-product-offer";
import { syncAccessProduct } from "@/lib/access-products/sync-access-product";

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
  const normalizedExistingLegacyUrl = normalizePublicPathInput(existing.legacyUrl);
  const normalizedExistingPublicPath = normalizePublicPathInput(existing.publicPath);
  const normalizedInputLegacyUrl = data.legacyUrl === undefined ? undefined : normalizePublicPathInput(data.legacyUrl);
  const defaultPath = `/course/${existing.slug}`;
  const hasLockedCanonicalPath =
    Boolean(normalizedExistingLegacyUrl) ||
    Boolean(normalizedExistingPublicPath && normalizedExistingPublicPath !== defaultPath);
  const lockedCanonicalPath =
    normalizedExistingPublicPath && hasLockedCanonicalPath
      ? normalizedExistingPublicPath
      : normalizedExistingLegacyUrl
        ? normalizedExistingLegacyUrl
        : null;
  const desiredPath =
    lockedCanonicalPath
      ? lockedCanonicalPath
      : data.legacyUrl === undefined
      ? (normalizedExistingPublicPath ?? `/course/${slug}`)
      : normalizedInputLegacyUrl
        ? normalizedInputLegacyUrl
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
      upsellDiscountValue:
        data.upsellDiscountType === "NONE"
          ? null
          : data.upsellDiscountValue === undefined
            ? undefined
            : data.upsellDiscountValue,
      upsellHeadline: data.upsellHeadline === "" ? null : data.upsellHeadline,
      upsellBody: data.upsellBody === "" ? null : data.upsellBody,
      legacyCourseId: data.legacyCourseId === "" ? null : data.legacyCourseId,
      legacySlug: data.legacySlug === "" ? null : data.legacySlug,
      legacyUrl: lockedCanonicalPath ? normalizedExistingLegacyUrl : data.legacyUrl === "" ? null : normalizedInputLegacyUrl,
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
  return course;
}
