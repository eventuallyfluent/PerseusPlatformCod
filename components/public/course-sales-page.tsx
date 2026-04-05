import { RenderProductSalesPage } from "@/components/sales-page/render-product-sales-page";
import { buildCourseStructuredData, buildFaqStructuredData, buildProductStructuredData } from "@/lib/seo/structured-data";
import type { CourseWithRelations, GeneratedSalesPagePayload } from "@/types";

export function CourseSalesPage({ course, payload }: { course: CourseWithRelations; payload: GeneratedSalesPagePayload }) {
  const courseJsonLd = buildCourseStructuredData(course, payload);
  const productJsonLd = buildProductStructuredData(course, payload);
  const faqJsonLd = payload.faqSection.items.length > 0 ? buildFaqStructuredData({ faqs: payload.faqSection.items }) : null;

  return (
    <div className="py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}
      <RenderProductSalesPage payload={payload} />
    </div>
  );
}
