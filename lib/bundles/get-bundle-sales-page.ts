import { generateBundleSalesPagePayload } from "@/lib/bundles/generate-bundle-sales-page-payload";
import type { BundleSalesPagePayload, BundleWithRelations } from "@/types";

export function getBundleSalesPage(bundle: BundleWithRelations): BundleSalesPagePayload {
  const salesPage = bundle.pages.find((page) => page.pageType === "bundle-sales");

  if (salesPage?.isOverrideActive && salesPage.overridePayload) {
    const overridePayload = salesPage.overridePayload as Partial<BundleSalesPagePayload>;

    if (overridePayload.version === "v2") {
      return overridePayload as BundleSalesPagePayload;
    }
  }

  if (salesPage?.generatedPayload) {
    const generatedPayload = salesPage.generatedPayload as Partial<BundleSalesPagePayload>;

    if (generatedPayload.version === "v2") {
      return generateBundleSalesPagePayload(bundle);
    }
  }

  return generateBundleSalesPagePayload(bundle);
}
