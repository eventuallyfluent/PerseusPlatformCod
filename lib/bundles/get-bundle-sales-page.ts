import { generateBundleSalesPagePayload } from "@/lib/bundles/generate-bundle-sales-page-payload";
import type { BundleSalesPagePayload, BundleWithRelations } from "@/types";

export function getBundleSalesPage(bundle: BundleWithRelations): BundleSalesPagePayload {
  const salesPage = bundle.pages.find((page) => page.pageType === "bundle-sales");

  if (salesPage?.isOverrideActive && salesPage.overridePayload) {
    return salesPage.overridePayload as BundleSalesPagePayload;
  }

  if (salesPage?.generatedPayload) {
    return salesPage.generatedPayload as BundleSalesPagePayload;
  }

  return generateBundleSalesPagePayload(bundle);
}
