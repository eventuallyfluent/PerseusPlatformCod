import { prisma } from "@/lib/db/prisma";
import { bundleInputSchema } from "@/lib/zod/schemas";
import { validatePublicPathAvailability } from "@/lib/urls/validate-public-path";
import { bundleInclude } from "@/lib/bundles/bundle-query";
import { persistGeneratedBundlePage } from "@/lib/bundles/persist-generated-bundle-page";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { normalizePublicPathInput } from "@/lib/urls/normalize-public-path";
import { syncProductOffer } from "@/lib/offers/sync-product-offer";
import { syncAccessProduct } from "@/lib/access-products/sync-access-product";

export async function createBundle(input: unknown) {
  const data = bundleInputSchema.parse(input);
  const normalizedLegacyUrl = normalizePublicPathInput(data.legacyUrl);
  const desiredPath = normalizedLegacyUrl ?? `/bundle/${data.slug}`;
  const isAvailable = await validatePublicPathAvailability(desiredPath);

  if (!isAvailable) {
    throw new Error(`Public path collision detected for ${desiredPath}`);
  }

  const bundle = await prisma.bundle.create({
    data: {
      ...data,
      heroImageUrl: data.heroImageUrl || null,
      salesVideoUrl: data.salesVideoUrl || null,
      upsellDiscountValue: data.upsellDiscountType === "NONE" ? null : data.upsellDiscountValue ?? null,
      upsellHeadline: data.upsellHeadline || null,
      upsellBody: data.upsellBody || null,
      legacyUrl: normalizedLegacyUrl,
      publicPath: desiredPath,
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
    grantedCourseIds: [],
  });

  await persistGeneratedBundlePage(bundle);
  return { ...bundle, publicPath: resolveBundlePublicPath(bundle) };
}
