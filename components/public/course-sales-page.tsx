import { RenderSalesPage } from "@/components/sales-page/render-sales-page";
import { buildCourseStructuredData, buildFaqStructuredData, buildProductStructuredData } from "@/lib/seo/structured-data";
import type { CourseWithRelations, GeneratedSalesPagePayload } from "@/types";

export function CourseSalesPage({ course, payload }: { course: CourseWithRelations; payload: GeneratedSalesPagePayload }) {
  const courseJsonLd = buildCourseStructuredData(course, payload);
  const productJsonLd = buildProductStructuredData(course, payload);
  const faqJsonLd = payload.faqs.length > 0 ? buildFaqStructuredData(payload) : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}
      <RenderSalesPage payload={payload} />
    </div>
  );
}
