import { prisma } from "@/lib/db/prisma";
import { generateBundleSalesPagePayload, getBundleSalesPagePath } from "@/lib/bundles/generate-bundle-sales-page-payload";
import { generateBundleThankYouPagePayload, getBundleThankYouPagePath } from "@/lib/bundles/generate-bundle-thank-you-page-payload";
import type { BundleWithRelations } from "@/types";

export async function persistGeneratedBundlePage(bundle: BundleWithRelations, force = false) {
  const existingSalesPage = bundle.pages.find((page) => page.pageType === "bundle-sales");
  const existingThankYouPage = bundle.pages.find((page) => page.pageType === "bundle-thank-you");

  if (existingSalesPage?.isOverrideActive && existingThankYouPage?.isOverrideActive && !force) {
    return existingSalesPage;
  }

  const salesPayload = generateBundleSalesPagePayload(bundle);
  const thankYouPayload = generateBundleThankYouPagePayload(bundle);
  const salesPath = getBundleSalesPagePath(bundle);
  const thankYouPath = getBundleThankYouPagePath(bundle);

  const [salesPage] = await prisma.$transaction([
    existingSalesPage && !(existingSalesPage.isOverrideActive && !force)
      ? prisma.generatedPage.update({
          where: { id: existingSalesPage.id },
          data: {
            generatedPayload: salesPayload,
            templateVersion: "v2",
            pageType: "bundle-sales",
            path: salesPath,
          },
        })
      : existingSalesPage
        ? prisma.generatedPage.findUniqueOrThrow({
            where: { id: existingSalesPage.id },
          })
        : prisma.generatedPage.create({
            data: {
              bundleId: bundle.id,
              pageType: "bundle-sales",
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
            pageType: "bundle-thank-you",
            path: thankYouPath,
          },
        })
      : existingThankYouPage
        ? prisma.generatedPage.findUniqueOrThrow({
            where: { id: existingThankYouPage.id },
          })
        : prisma.generatedPage.create({
            data: {
              bundleId: bundle.id,
              pageType: "bundle-thank-you",
              path: thankYouPath,
              templateVersion: "v1",
              generatedPayload: thankYouPayload,
            },
          }),
  ]);

  return salesPage;
}
