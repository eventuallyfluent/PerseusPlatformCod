import type { BundleWithRelations, ProductThankYouPagePayload } from "@/types";
import { generateBundleThankYouPagePayload } from "@/lib/bundles/generate-bundle-thank-you-page-payload";

export function getBundleThankYouPage(bundle: BundleWithRelations): ProductThankYouPagePayload {
  const thankYouPage = bundle.pages.find((page) => page.pageType === "bundle-thank-you");

  if (thankYouPage?.isOverrideActive && thankYouPage.overridePayload) {
    const overridePayload = thankYouPage.overridePayload as Partial<ProductThankYouPagePayload>;

    if (overridePayload.version === "v1") {
      return overridePayload as ProductThankYouPagePayload;
    }
  }

  return generateBundleThankYouPagePayload(bundle);
}
