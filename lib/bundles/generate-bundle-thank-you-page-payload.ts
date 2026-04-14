import { parseSalesPageConfig } from "@/lib/sales-pages/sales-page-config";
import { resolveBundleThankYouPath } from "@/lib/urls/resolve-bundle-path";
import type { BundleWithRelations, ProductThankYouPagePayload } from "@/types";

export function generateBundleThankYouPagePayload(bundle: BundleWithRelations): ProductThankYouPagePayload {
  const config = parseSalesPageConfig(bundle.salesPageConfig);

  return {
    version: "v1",
    productType: "bundle",
    eyebrow: config.thankYouEyebrow || "Purchase confirmed",
    headline: config.thankYouHeadline || "Your bundle is unlocked.",
    body:
      config.thankYouBody ||
      "Your purchase is complete. Every included course is now available from your learner dashboard so you can begin where you want.",
    productTitle: bundle.title,
    productSubtitle: bundle.subtitle,
    imageUrl: bundle.heroImageUrl,
    summaryLabel: "Bundle access",
    summaryValue: `${bundle.courses.length} included course${bundle.courses.length === 1 ? "" : "s"}`,
    items: bundle.courses.map((item) => ({
      title: item.course.title,
      subtitle: item.course.subtitle,
    })),
    signedInActionLabel: config.thankYouSignedInLabel || "Go to dashboard",
    signedOutActionLabel: config.thankYouSignedOutLabel || "Student login",
  };
}

export function getBundleThankYouPagePath(bundle: BundleWithRelations) {
  return resolveBundleThankYouPath(bundle);
}
