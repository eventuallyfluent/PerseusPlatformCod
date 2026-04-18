import { buildBreadcrumbStructuredData, buildBundleProductStructuredData, buildFaqStructuredData } from "@/lib/seo/structured-data";
import { RenderProductSalesPage } from "@/components/sales-page/render-product-sales-page";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import type { BundleSalesPagePayload, BundleWithRelations } from "@/types";

export function BundleSalesPage({ bundle, payload }: { bundle: BundleWithRelations; payload: BundleSalesPagePayload }) {
  const productJsonLd = buildBundleProductStructuredData(bundle, payload);
  const faqJsonLd = payload.faqSection.items.length > 0 ? buildFaqStructuredData({ faqs: payload.faqSection.items }) : null;
  const breadcrumbJsonLd = buildBreadcrumbStructuredData([
    { name: "Home", path: "/" },
    { name: bundle.title, path: resolveBundlePublicPath(bundle) },
  ]);

  return (
    <div className="px-6 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}
      <RenderProductSalesPage payload={payload} />
    </div>
  );
}
