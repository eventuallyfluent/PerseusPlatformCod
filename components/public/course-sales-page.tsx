import { RenderProductSalesPage } from "@/components/sales-page/render-product-sales-page";
import { Button } from "@/components/ui/button";
import { submitCourseReviewAction } from "@/app/(public)/actions";
import { buildCourseStructuredData, buildFaqStructuredData, buildProductStructuredData } from "@/lib/seo/structured-data";
import type { CourseWithRelations, GeneratedSalesPagePayload } from "@/types";

function RatingStars({ rating }: { rating: number }) {
  return (
    <div aria-label={`${rating} star rating`} className="flex gap-1 text-lg leading-none text-[#ffc247]">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index}>{index < rating ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export function CourseSalesPage({
  course,
  payload,
  canLeaveReview,
  existingReview,
}: {
  course: CourseWithRelations;
  payload: GeneratedSalesPagePayload;
  canLeaveReview: boolean;
  existingReview?: { quote: string; isApproved: boolean; rating: number } | null;
}) {
  const courseJsonLd = buildCourseStructuredData(course, payload);
  const productJsonLd = buildProductStructuredData(course, payload);
  const faqJsonLd = payload.faqSection.items.length > 0 ? buildFaqStructuredData({ faqs: payload.faqSection.items }) : null;

  const reviewSlot = canLeaveReview ? (
    <div id="leave-review" className="mx-auto max-w-5xl rounded-[30px] border border-[var(--portal-border)] bg-[rgba(19,20,40,0.96)] p-6 text-white shadow-[0_24px_60px_rgba(18,20,41,0.16)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-3xl leading-none tracking-[-0.03em]">Customer Reviews</h3>
          <p className="text-sm leading-7 text-[#d2c6ee]">
            Reviews from students go live after approval.
            {existingReview ? ` Your current review is ${existingReview.isApproved ? "approved" : "pending approval"}.` : ""}
          </p>
        </div>
        <a href="#leave-review-form">
          <Button>Write a Review</Button>
        </a>
      </div>
      <form id="leave-review-form" action={submitCourseReviewAction} className="mt-6 grid gap-4">
        <input type="hidden" name="courseId" value={course.id} />
        <input type="hidden" name="courseSlug" value={course.slug} />
        <div className="space-y-2">
          <span className="text-sm font-medium text-white">Rating</span>
          <div className="flex flex-wrap gap-2">
            {([5, 4, 3, 2, 1] as const).map((value) => (
              <label
                key={value}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--portal-border)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-white transition hover:bg-[rgba(255,255,255,0.08)]"
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="rating"
                  value={value}
                  defaultChecked={(existingReview?.rating ?? 5) === value}
                />
                <RatingStars rating={value} />
              </label>
            ))}
          </div>
        </div>
        <label className="space-y-2">
          <span className="text-sm font-medium text-white">Your review</span>
          <textarea
            name="quote"
            rows={4}
            required
            defaultValue={existingReview?.quote ?? ""}
            className="w-full rounded-[20px] border border-[var(--portal-border)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm leading-7 text-white outline-none transition focus:border-[rgba(143,44,255,0.55)]"
          />
        </label>
        <div>
          <Button type="submit">{existingReview ? "Update review" : "Submit review"}</Button>
        </div>
      </form>
    </div>
  ) : null;

  return (
    <div className="py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}
      <RenderProductSalesPage payload={payload} reviewSlot={reviewSlot} />
    </div>
  );
}
