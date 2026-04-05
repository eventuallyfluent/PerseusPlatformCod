import { prisma } from "@/lib/db/prisma";
import { generateBundleSalesPagePayload, getBundleSalesPagePath } from "@/lib/bundles/generate-bundle-sales-page-payload";
import type { BundleWithRelations } from "@/types";

export async function persistGeneratedBundlePage(bundle: BundleWithRelations, force = false) {
  const existing = bundle.pages.find((page) => page.pageType === "bundle-sales");
  const nextPath = getBundleSalesPagePath(bundle);

  if (existing?.isOverrideActive && !force) {
    return existing;
  }

  if (existing) {
    return prisma.generatedPage.update({
      where: { id: existing.id },
      data: {
        generatedPayload: generateBundleSalesPagePayload(bundle),
        templateVersion: "v2",
        pageType: "bundle-sales",
        path: nextPath,
      },
    });
  }

  return prisma.generatedPage.create({
    data: {
      bundleId: bundle.id,
      pageType: "bundle-sales",
      path: nextPath,
      templateVersion: "v2",
      generatedPayload: generateBundleSalesPagePayload(bundle),
    },
  });
}
