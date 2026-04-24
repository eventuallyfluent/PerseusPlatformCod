import { RenderProductSalesPage } from "@/components/sales-page/render-product-sales-page";
import { Button } from "@/components/ui/button";
import { submitCourseReviewAction } from "@/app/(public)/actions";
import { buildBreadcrumbStructuredData, buildCourseStructuredData, buildFaqStructuredData, buildProductStructuredData } from "@/lib/seo/structured-data";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";
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
  isLoggedIn,
  reviewLoginHref,
  existingReview,
}: {
  course: CourseWithRelations;
  payload: GeneratedSalesPagePayload;
  canLeaveReview: boolean;
  isLoggedIn: boolean;
  reviewLoginHref: string;
  existingReview?: { quote: string; isApproved: boolean; rating: number } | null;
}) {
  const courseJsonLd = buildCourseStructuredData(course, payload);
  const productJsonLd = buildProductStructuredData(course, payload);
  const faqJsonLd = payload.faqSection.items.length > 0 ? buildFaqStructuredData({ faqs: payload.faqSection.items }) : null;
  const breadcrumbJsonLd = buildBreadcrumbStructuredData([
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: course.title, path: resolveCoursePublicPath(course) },
  ]);

  const reviewSlot = (
    <div
      id="leave-review"
      className="mx-auto max-w-5xl rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,var(--surface-panel-strong),var(--surface-panel))] p-6 text-[var(--text-primary)] shadow-[var(--shadow-panel)] lg:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]">Student reviews</p>
          <h3 className="text-3xl leading-none tracking-[-0.03em]">What learners say after joining.</h3>
          <p className="text-sm leading-7 text-[var(--text-secondary)]">Verified student reviews are published after approval.</p>
        </div>
        {isLoggedIn ? (
          <a href="#leave-review-form">
            <Button>Leave a Review</Button>
          </a>
        ) : (
          <a href={reviewLoginHref}>
            <Button>Sign in to Leave a Review</Button>
          </a>
        )}
      </div>
      {!isLoggedIn ? (
        <p className="mt-6 rounded-[22px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3 text-sm leading-7 text-[var(--text-secondary)]">
          Sign in with your learner email and you will land directly in the review form.
        </p>
      ) : canLeaveReview ? (
        <form id="leave-review-form" action={submitCourseReviewAction} className="mt-6 grid gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-panel)] p-5">
          <input type="hidden" name="courseId" value={course.id} />
          <input type="hidden" name="courseSlug" value={course.slug} />
          <div className="space-y-2">
            <span className="text-sm font-medium text-[var(--text-primary)]">Rating</span>
            <div className="flex flex-wrap gap-2">
              {([5, 4, 3, 2, 1] as const).map((value) => (
                <label
                  key={value}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-2 text-sm text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-panel)]"
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
            <span className="text-sm font-medium text-[var(--text-primary)]">Your review</span>
            <textarea
              name="quote"
              rows={4}
              required
              defaultValue={existingReview?.quote ?? ""}
              className="w-full rounded-[20px] border border-[var(--border)] bg-[var(--surface-panel-strong)] px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
            />
          </label>
          <p className="text-sm leading-7 text-[var(--text-secondary)]">
            {existingReview ? `Your current review is ${existingReview.isApproved ? "approved" : "pending approval"}.` : "Your review will appear after approval."}
          </p>
          <div>
            <Button type="submit">{existingReview ? "Update review" : "Submit review"}</Button>
          </div>
        </form>
      ) : (
        <p id="leave-review-form" className="mt-6 rounded-[22px] border border-[var(--border)] bg-[var(--surface-panel)] px-4 py-3 text-sm leading-7 text-[var(--text-secondary)]">
          Reviews are available to enrolled students after purchase.
        </p>
      )}
    </div>
  );

  return (
    <div className="py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}
      <RenderProductSalesPage payload={payload} reviewSlot={reviewSlot} />
    </div>
  );
}
