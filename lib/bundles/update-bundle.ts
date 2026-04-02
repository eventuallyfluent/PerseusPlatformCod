import { prisma } from "@/lib/db/prisma";
import { bundleInputSchema } from "@/lib/zod/schemas";
import { validatePublicPathAvailability } from "@/lib/urls/validate-public-path";
import { bundleInclude } from "@/lib/bundles/bundle-query";
import { persistGeneratedBundlePage } from "@/lib/bundles/persist-generated-bundle-page";

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
  const desiredPath =
    data.legacyUrl === undefined ? existing.publicPath ?? `/bundle/${slug}` : data.legacyUrl || `/bundle/${slug}`;

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
    },
    include: bundleInclude,
  });

  await persistGeneratedBundlePage(bundle);
  return bundle;
}
