import { prisma } from "@/lib/db/prisma";
import { bundleInputSchema } from "@/lib/zod/schemas";
import { validatePublicPathAvailability } from "@/lib/urls/validate-public-path";
import { bundleInclude } from "@/lib/bundles/bundle-query";
import { persistGeneratedBundlePage } from "@/lib/bundles/persist-generated-bundle-page";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";

export async function createBundle(input: unknown) {
  const data = bundleInputSchema.parse(input);
  const desiredPath = data.legacyUrl || `/bundle/${data.slug}`;
  const isAvailable = await validatePublicPathAvailability(desiredPath);

  if (!isAvailable) {
    throw new Error(`Public path collision detected for ${desiredPath}`);
  }

  const bundle = await prisma.bundle.create({
    data: {
      ...data,
      heroImageUrl: data.heroImageUrl || null,
      salesVideoUrl: data.salesVideoUrl || null,
      legacyUrl: data.legacyUrl || null,
      publicPath: desiredPath,
    },
    include: bundleInclude,
  });

  await persistGeneratedBundlePage(bundle);
  return { ...bundle, publicPath: resolveBundlePublicPath(bundle) };
}
