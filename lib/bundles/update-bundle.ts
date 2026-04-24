import { prisma } from "@/lib/db/prisma";
import { bundleInputSchema } from "@/lib/zod/schemas";
import { validatePublicPathAvailability } from "@/lib/urls/validate-public-path";
import { normalizePublicPathInput } from "@/lib/urls/normalize-public-path";
import { bundleInclude } from "@/lib/bundles/bundle-query";
import { persistGeneratedBundlePage } from "@/lib/bundles/persist-generated-bundle-page";
import { syncProductOffer } from "@/lib/offers/sync-product-offer";
import { syncAccessProduct } from "@/lib/access-products/sync-access-product";

export async function updateBundle(bundleId: string, input: unknown) {
  const data = bundleInputSchema.partial().parse(input);
  const existing = await prisma.bundle.findUnique({
    where: { id: bundleId },
    select: { slug: true, publicPath: true, legacyUrl: true },
  });

  if (!existing) {
    throw new Error("Bundle not found");
  }

  const slug = data.slug ?? existing.slug;
  const normalizedExistingLegacyUrl = normalizePublicPathInput(existing.legacyUrl);
  const normalizedExistingPublicPath = normalizePublicPathInput(existing.publicPath);
  const normalizedInputLegacyUrl = data.legacyUrl === undefined ? undefined : normalizePublicPathInput(data.legacyUrl);
  const defaultPath = `/bundle/${existing.slug}`;
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
      ? (normalizedExistingPublicPath ?? `/bundle/${slug}`)
      : normalizedInputLegacyUrl
        ? normalizedInputLegacyUrl
        : `/bundle/${slug}`;

  const isAvailable = await validatePublicPathAvailability(desiredPath, undefined, bundleId);

  if (!isAvailable) {
    throw new Error(`Public path collision detected for ${desiredPath}`);
  }

  const bundle = await prisma.bundle.update({
    where: { id: bundleId },
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
      legacyUrl: lockedCanonicalPath ? normalizedExistingLegacyUrl : data.legacyUrl === "" ? null : normalizedInputLegacyUrl,
    },
    include: bundleInclude,
  });

  await syncProductOffer({
    bundleId: bundle.id,
    title: bundle.title,
    price: bundle.price.toString(),
    currency: bundle.currency,
    compareAtPrice: bundle.compareAtPrice?.toString() ?? null,
    status: bundle.status,
  });

  await syncAccessProduct({
    bundleId: bundle.id,
    slug: bundle.slug,
    title: `${bundle.title} access`,
    status: bundle.status,
    description: bundle.shortDescription,
    grantedCourseIds: bundle.courses.map((item) => item.courseId),
  });

  await persistGeneratedBundlePage(bundle);
  return bundle;
}
