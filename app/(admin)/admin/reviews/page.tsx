import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { HardLink } from "@/components/ui/hard-link";
import { deleteTestimonialAction, saveTestimonialAction } from "@/app/(admin)/admin/actions";
import { prisma } from "@/lib/db/prisma";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { resolveCoursePublicPath } from "@/lib/urls/resolve-course-path";

export const dynamic = "force-dynamic";

function getReviewSource(review: {
  course: { id: string; title: string; slug: string; publicPath: string | null; legacyUrl: string | null } | null;
  bundle: { id: string; title: string; slug: string; publicPath: string | null; legacyUrl: string | null } | null;
}) {
  if (review.course) {
    return {
      type: "Course",
      title: review.course.title,
      editHref: `/admin/courses/${review.course.id}`,
      publicHref: resolveCoursePublicPath(review.course),
    };
  }

  if (review.bundle) {
    return {
      type: "Bundle",
      title: review.bundle.title,
      editHref: `/admin/bundles/${review.bundle.id}`,
      publicHref: resolveBundlePublicPath(review.bundle),
    };
  }

  return {
    type: "Review",
    title: "Unlinked review",
    editHref: "/admin/reviews",
    publicHref: "/",
  };
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const reviews = await prisma.testimonial.findMany({
    where: { isApproved: false },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          publicPath: true,
          legacyUrl: true,
        },
      },
      bundle: {
        select: {
          id: true,
          title: true,
          slug: true,
          publicPath: true,
          legacyUrl: true,
        },
      },
    },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });

  const feedbackMessage = resolvedSearchParams?.saved === "reviews" ? "Review queue updated." : "";
  const errorMessage = resolvedSearchParams?.error === "reviews" ? "Review update failed. Try again." : "";

  return (
    <AdminShell title="Review queue" description="Approve or delete submitted buyer reviews before they appear publicly.">
      <Card className="space-y-5 border-stone-200 bg-white text-stone-950">
        {feedbackMessage ? <p className="rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedbackMessage}</p> : null}
        {errorMessage ? <p className="rounded-[18px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">Pending reviews</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-stone-950">{reviews.length} waiting for approval</h2>
          </div>
          <HardLink href="/admin" className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100">
            Back to admin
          </HardLink>
        </div>

        <div className="grid gap-4">
          {reviews.length > 0 ? (
            reviews.map((review) => {
              const source = getReviewSource(review);
              const productIdField = review.courseId ? (
                <input type="hidden" name="courseId" value={review.courseId} />
              ) : review.bundleId ? (
                <input type="hidden" name="bundleId" value={review.bundleId} />
              ) : null;

              return (
                <article key={review.id} className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-700">
                          {source.type}
                        </span>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                          Pending approval
                        </span>
                        {review.recommendsProduct ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                            Recommends
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-stone-950">{source.title}</h3>
                        <p className="mt-1 text-sm text-stone-600">
                          {review.name || "Anonymous"} {review.email ? `(${review.email})` : ""} - {review.rating}/5
                        </p>
                      </div>
                      <blockquote className="whitespace-pre-wrap rounded-[20px] border border-stone-200 bg-white px-5 py-4 text-base leading-8 text-stone-800">
                        {review.quote}
                      </blockquote>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-3 lg:justify-end">
                      <HardLink href={source.publicHref} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100">
                        View page
                      </HardLink>
                      <HardLink href={source.editHref} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100">
                        Product reviews
                      </HardLink>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={saveTestimonialAction}>
                      <input type="hidden" name="reviewReturnPath" value="/admin/reviews" />
                      <input type="hidden" name="testimonialId" value={review.id} />
                      {productIdField}
                      <input type="hidden" name="name" value={review.name ?? ""} />
                      <input type="hidden" name="email" value={review.email ?? ""} />
                      <input type="hidden" name="quote" value={review.quote} />
                      <input type="hidden" name="rating" value={review.rating} />
                      <input type="hidden" name="position" value={review.position} />
                      <input type="hidden" name="isApproved" value="true" />
                      {review.recommendsProduct ? <input type="hidden" name="recommendsProduct" value="true" /> : null}
                      <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800" type="submit">
                        Approve review
                      </button>
                    </form>
                    <form action={deleteTestimonialAction}>
                      <input type="hidden" name="reviewReturnPath" value="/admin/reviews" />
                      <input type="hidden" name="testimonialId" value={review.id} />
                      {productIdField}
                      <button className="rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50" type="submit">
                        Delete review
                      </button>
                    </form>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50 px-5 py-8 text-center text-sm text-stone-600">
              No pending reviews. Submitted buyer reviews will appear here before they go public.
            </div>
          )}
        </div>
      </Card>
    </AdminShell>
  );
}
