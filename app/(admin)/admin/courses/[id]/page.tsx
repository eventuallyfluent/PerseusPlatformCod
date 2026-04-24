import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { ImageField } from "@/components/admin/image-field";
import { ProductFormSection } from "@/components/admin/product-form-shell";
import { HardLink } from "@/components/ui/hard-link";
import { parseSalesPageConfig } from "@/lib/sales-pages/sales-page-config";
import { resolveCoursePublicPath, resolveCourseThankYouPath } from "@/lib/urls/resolve-course-path";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";
import { addLessonAction, addModuleAction, deleteCourseAction, deleteFaqAction, deleteLessonAction, deleteModuleAction, deleteTestimonialAction, regeneratePageAction, saveCourseAction, saveFaqAction, saveTestimonialAction, setCourseStatusAction } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

function formatLessonType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function formatDripSummary(dripDays: number | null) {
  if (!dripDays || dripDays <= 0) {
    return "Available immediately";
  }

  return `Unlocks on day ${dripDays}`;
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const uploadEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [course, instructors, upsellCourses, upsellBundles] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        instructor: true,
        upsellCourse: true,
        upsellBundle: true,
        modules: { include: { lessons: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } },
        offers: true,
        accessProduct: {
          include: {
            grants: {
              orderBy: { position: "asc" },
            },
          },
        },
        faqs: { orderBy: { position: "asc" } },
        testimonials: { orderBy: { position: "asc" } },
        pages: true,
      },
    }),
    prisma.instructor.findMany({ orderBy: { name: "asc" } }),
    prisma.course.findMany({
      where: { id: { not: id } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    prisma.bundle.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!course) notFound();
  const previewOffer = getPrimaryOffer(course.offers);
  const publicPagePath = resolveCoursePublicPath(course);
  const thankYouPagePath = resolveCourseThankYouPath(course);
  const canonicalPathLocked =
    Boolean(course.legacyUrl?.startsWith("/")) || Boolean(course.publicPath?.startsWith("/") && course.publicPath !== `/course/${course.slug}`);
  const salesPageConfig = parseSalesPageConfig(course.salesPageConfig);
  const upsellTarget = course.upsellCourseId ? `course:${course.upsellCourseId}` : course.upsellBundleId ? `bundle:${course.upsellBundleId}` : "";
  const totalLessons = course.modules.reduce((count, module) => count + module.lessons.length, 0);
  const dripLessons = course.modules.reduce(
    (count, module) => count + module.lessons.filter((lesson) => (lesson.dripDays ?? 0) > 0).length,
    0,
  );
  const latestDripDay = Math.max(0, ...course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.dripDays ?? 0)));
  const relatedOfferLabel = course.upsellCourse?.title ?? course.upsellBundle?.title ?? null;
  const feedbackMessage =
    resolvedSearchParams?.saved === "details"
      ? "Course details saved."
      : resolvedSearchParams?.saved === "curriculum"
        ? "Curriculum updated."
        : resolvedSearchParams?.saved === "faq"
          ? "FAQ updated."
          : resolvedSearchParams?.saved === "reviews"
            ? "Reviews updated."
            : resolvedSearchParams?.saved === "offer"
              ? "Checkout offer updated."
            : resolvedSearchParams?.saved === "page"
              ? "Sales page regenerated."
              : resolvedSearchParams?.saved === "status"
                ? "Course status updated."
                : "";
  const errorMessage =
    resolvedSearchParams?.error === "lesson"
      ? "Lesson changes could not be saved. Check the lesson fields and try again."
      : resolvedSearchParams?.error === "details"
        ? "Course changes could not be saved. Check the form fields and try again."
        : resolvedSearchParams?.error === "curriculum"
          ? "Curriculum changes could not be saved. Check the module or lesson fields and try again."
          : resolvedSearchParams?.error === "faq"
            ? "FAQ changes could not be saved. Try that section again."
            : resolvedSearchParams?.error === "reviews"
              ? "Review changes could not be saved. Try that section again."
              : resolvedSearchParams?.error === "page"
                ? "The sales page could not be regenerated. Try again."
                : resolvedSearchParams?.error === "status"
                  ? "The course status could not be updated. Try again."
                  : resolvedSearchParams?.error === "offer"
                    ? "The checkout offer could not be updated. Try again."
                  : resolvedSearchParams?.error === "delete"
                    ? "The course could not be deleted. Remove dependent records first and try again."
        : "";

  return (
    <AdminShell title={course.title} description="Edit the course content here. Pricing, checkout, and unlock rules live on the linked product.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="space-y-8 bg-white p-8">
            {feedbackMessage ? <p className="rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedbackMessage}</p> : null}
            {errorMessage ? <p className="rounded-[18px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}
            <div className="space-y-4 border-b border-[var(--border)] pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Course content</p>
              <h2 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">Manage the course itself here, then use the product for commerce settings.</h2>
            </div>
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-900">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">Canonical public URL</span>
              <span className="mt-2 block break-all font-semibold text-stone-950">{publicPagePath}</span>
              <p className="mt-2">This is the live SEO path for this migrated course. Routine edits do not change it.</p>
            </div>
            <form id="course-details-form" action={saveCourseAction} className="space-y-8">
              <input type="hidden" name="id" value={course.id} />
              <ProductFormSection id="core-identity" title="Core identity" description="Title, route, owner, and status." collapsible>
                <label>Title<input name="title" defaultValue={course.title} required /></label>
                <label>Slug<input name="slug" defaultValue={course.slug} required /></label>
                <label>Subtitle<input name="subtitle" defaultValue={course.subtitle ?? ""} /></label>
                <label>Instructor<select name="instructorId" defaultValue={course.instructorId}>{instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.name}</option>)}</select></label>
                <label>Status<select name="status" defaultValue={course.status}><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option><option value="ARCHIVED">ARCHIVED</option></select></label>
                <div className="hidden md:block" />
              </ProductFormSection>
              <ProductFormSection id="sales-copy" title="Sales copy" description="Core page copy." collapsible>
                <label className="lg:col-span-2">Short description<textarea name="shortDescription" rows={4} defaultValue={course.shortDescription ?? ""} /></label>
                <label className="lg:col-span-2">Long description<textarea name="longDescription" rows={6} defaultValue={course.longDescription ?? ""} /></label>
                <label className="lg:col-span-2">Outcomes<textarea name="learningOutcomes" rows={4} defaultValue={(course.learningOutcomes as string[] | null)?.join("\n") ?? ""} /></label>
                <label>Who it&apos;s for<textarea name="whoItsFor" rows={4} defaultValue={(course.whoItsFor as string[] | null)?.join("\n") ?? ""} /></label>
                <label>Includes<textarea name="includes" rows={4} defaultValue={(course.includes as string[] | null)?.join("\n") ?? ""} /></label>
              </ProductFormSection>
              <ProductFormSection id="media-seo" title="Media and SEO" description="Hero media and search." collapsible>
                <ImageField
                  name="heroImageUrl"
                  label="Course cover image URL"
                  defaultValue={course.heroImageUrl}
                  previewLabel="Current cover preview"
                  uploadFolder="courses"
                  uploadEnabled={uploadEnabled}
                />
                <label>Sales video URL<input name="salesVideoUrl" defaultValue={course.salesVideoUrl ?? ""} /></label>
                <label>SEO title<input name="seoTitle" defaultValue={course.seoTitle ?? ""} /></label>
                <label className="lg:col-span-2">SEO description<textarea name="seoDescription" rows={3} defaultValue={course.seoDescription ?? ""} /></label>
              </ProductFormSection>
              <ProductFormSection
                id="pricing-checkout"
                title="Related offer and pricing"
                description="Set the course price defaults and choose one follow-up offer to present after checkout. Use the linked product when you need to change checkout execution or access rules."
                collapsible
              >
                <label>Price<input name="price" type="number" min="0" step="0.01" defaultValue={course.price.toString()} /></label>
                <label>Currency<input name="currency" defaultValue={course.currency} /></label>
                <label>Compare-at price<input name="compareAtPrice" type="number" min="0" step="0.01" defaultValue={course.compareAtPrice?.toString() ?? ""} /></label>
                <label className="lg:col-span-2">
                  Related follow-up offer
                  <select name="upsellTarget" defaultValue={upsellTarget}>
                    <option value="">No related offer</option>
                    {upsellCourses.map((upsellCourse) => (
                      <option key={`course-${upsellCourse.id}`} value={`course:${upsellCourse.id}`}>
                        Course: {upsellCourse.title}
                      </option>
                    ))}
                    {upsellBundles.map((upsellBundle) => (
                      <option key={`bundle-${upsellBundle.id}`} value={`bundle:${upsellBundle.id}`}>
                        Bundle: {upsellBundle.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Related-offer discount type
                  <select name="upsellDiscountType" defaultValue={course.upsellDiscountType}>
                    <option value="NONE">No discount</option>
                    <option value="AMOUNT">Amount off</option>
                    <option value="PERCENT">Percent off</option>
                  </select>
                </label>
                <label>
                  Related-offer discount value
                  <input name="upsellDiscountValue" type="number" min="0.01" step="0.01" defaultValue={course.upsellDiscountValue?.toString() ?? ""} />
                </label>
                <label className="lg:col-span-2">Related-offer headline<input name="upsellHeadline" defaultValue={course.upsellHeadline ?? ""} placeholder="Optional override for the follow-up offer title" /></label>
                <label className="lg:col-span-2">Related-offer body<textarea name="upsellBody" rows={3} defaultValue={course.upsellBody ?? ""} placeholder="Explain why this is the next recommended offer." /></label>
                <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-700">
                  Keep this to one clear next offer. Pricing defaults live here, while the linked product remains the source of truth for checkout flow and unlock rules.
                </div>
              </ProductFormSection>
              <ProductFormSection
                id="pages"
                title="Pages"
                description="This is the public page summary for this course. Sales and checkout copy comes from the course content above."
                collapsible
              >
                <div className="lg:col-span-2 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Sales page</span>
                    <span className="mt-2 block break-all text-stone-950">{publicPagePath}</span>
                  </div>
                  <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Checkout page</span>
                    <span className="mt-2 block break-all text-stone-950">{previewOffer ? `/checkout/${previewOffer.id}` : "Create an offer to preview checkout."}</span>
                  </div>
                  <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Thank-you page</span>
                    <span className="mt-2 block break-all text-stone-950">{thankYouPagePath}</span>
                  </div>
                </div>
                <div className="lg:col-span-2 rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-700">
                  Edit the course once above, then use these links to view the three public surfaces. The only editable copy here is the thank-you page.
                </div>
                <label>Thank-you eyebrow<input name="salesPage.thankYouEyebrow" defaultValue={salesPageConfig.thankYouEyebrow ?? ""} /></label>
                <label>Signed-in CTA label<input name="salesPage.thankYouSignedInLabel" defaultValue={salesPageConfig.thankYouSignedInLabel ?? ""} /></label>
                <label>Signed-out CTA label<input name="salesPage.thankYouSignedOutLabel" defaultValue={salesPageConfig.thankYouSignedOutLabel ?? ""} /></label>
                <label className="lg:col-span-2">Thank-you headline<input name="salesPage.thankYouHeadline" defaultValue={salesPageConfig.thankYouHeadline ?? ""} /></label>
                <label className="lg:col-span-2">Thank-you body<textarea name="salesPage.thankYouBody" rows={3} defaultValue={salesPageConfig.thankYouBody ?? ""} /></label>
              </ProductFormSection>
              <ProductFormSection id="migration-urls" title="Publish and URL preservation" description="Preserved migrated routes stay canonical after migration and should be treated as SEO-critical." collapsible>
                <label>Legacy course ID<input name="legacyCourseId" defaultValue={course.legacyCourseId ?? ""} /></label>
                <label>Legacy slug<input name="legacySlug" defaultValue={course.legacySlug ?? ""} /></label>
                {canonicalPathLocked ? (
                  <>
                    <input type="hidden" name="legacyUrl" value={course.legacyUrl ?? ""} />
                    <label className="md:col-span-2">Canonical public URL<input name="legacyUrlDisplay" value={publicPagePath} readOnly /></label>
                    <div className="md:col-span-2 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
                      This route is locked because it is live and SEO-critical. Perseus keeps serving this exact path and does not replace it with the course slug route.
                    </div>
                  </>
                ) : (
                  <>
                    <label className="md:col-span-2">Canonical public URL<input name="legacyUrl" defaultValue={course.legacyUrl ?? ""} /></label>
                    <div className="md:col-span-2 rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-700">
                      Use a custom public URL only when preserving an existing live route. This affects the canonical path buyers and search engines use.
                    </div>
                  </>
                )}
              </ProductFormSection>
              <div className="border-t border-[var(--border)] pt-6"><button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit">Save course</button></div>
            </form>
          </Card>
          <Card className="space-y-4 bg-white p-6">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Course CSV</p>
              <h2 className="text-2xl leading-none tracking-[-0.03em] text-stone-950">Download the migration CSV, fill it with Payhip details, then upload it here.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/api/imports/templates/course-package" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">Download Course CSV</Link>
              <Link href="/api/imports/templates/course-students" className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-800">Download Course Students CSV</Link>
            </div>
            <p className="text-sm leading-7 text-stone-700">One row = one lesson. Repeat course-level fields on each row, including instructor slug/name. Add testimonial columns, including rating, on any rows where you want imported Payhip reviews. Use the student CSV only for enrollments into this course.</p>
            <div className="grid gap-4 xl:grid-cols-2">
              <form action="/api/imports/course-package" method="post" encType="multipart/form-data" className="grid gap-3 rounded-[20px] border border-dashed border-stone-300 p-4">
                <label>Upload completed course migration CSV<input type="file" name="file" accept=".csv" required /></label>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit" name="mode" value="dry-run">Dry run</button>
                  <button className="rounded-full border border-stone-300 px-4 py-3 text-sm font-medium text-stone-800" type="submit" name="mode" value="execute">Execute import</button>
                </div>
              </form>
              <form action="/api/imports/course-students" method="post" encType="multipart/form-data" className="grid gap-3 rounded-[20px] border border-dashed border-stone-300 p-4">
                <input type="hidden" name="courseId" value={course.id} />
                <label>Upload completed student migration CSV<input type="file" name="file" accept=".csv" required /></label>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit" name="mode" value="dry-run">Dry run</button>
                  <button className="rounded-full border border-stone-300 px-4 py-3 text-sm font-medium text-stone-800" type="submit" name="mode" value="execute">Import students</button>
                </div>
              </form>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="space-y-5 bg-white p-5">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Content workspace</p>
              <h3 className="text-lg font-semibold text-stone-950">Keep course editing here. Use the linked product for commerce.</h3>
            </div>
            <div className="grid gap-3 text-sm text-stone-700">
              <button
                className="w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50"
                type="submit"
                form="course-details-form"
              >
                Save course changes
              </button>
              {course.accessProduct ? (
                <div className="rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-4">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Linked product</span>
                  <span className="mt-1 block text-base font-semibold text-stone-950">{course.accessProduct.title}</span>
                  <p className="mt-2 text-sm leading-6 text-stone-600">Pricing, checkout flow, and unlock rules live on the product side.</p>
                  <HardLink href={`/admin/products/${course.accessProduct.id}`} className="mt-3 inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-stone-50">
                    Manage product
                  </HardLink>
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Current status</span><span className="mt-1 block text-base font-semibold text-stone-950">{course.status}</span></div>
                <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Curriculum</span>
                  <span className="mt-1 block text-base text-stone-950">
                    {course.modules.length} module{course.modules.length === 1 ? "" : "s"} · {totalLessons} lesson{totalLessons === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Drip schedule</span>
                  <span className="mt-1 block text-base text-stone-950">
                    {dripLessons > 0 ? `${dripLessons} delayed lesson${dripLessons === 1 ? "" : "s"}` : "All lessons unlock immediately"}
                  </span>
                  {dripLessons > 0 ? <p className="mt-1 text-sm text-stone-600">Latest unlock: day {latestDripDay}</p> : null}
                </div>
                <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Related offer</span>
                  <span className="mt-1 block text-base text-stone-950">{relatedOfferLabel ?? "No follow-up offer set"}</span>
                </div>
                <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">Canonical URL</span><span className="mt-1 block break-all text-base text-stone-950">{publicPagePath}</span></div>
                <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Sales page</span><span className="mt-1 block break-all text-base text-stone-950">{publicPagePath}</span></div>
                <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Thank-you page</span><span className="mt-1 block break-all text-base text-stone-950">{thankYouPagePath}</span></div>
              </div>
            </div>
          </Card>
          <Card className="space-y-4 bg-white p-5">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Page structure</p>
              <p className="text-sm leading-6 text-stone-600">Jump directly to the section you need. Keep commerce, pages, and drip checks separate from curriculum editing.</p>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-1">
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#core-identity">Core identity</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#sales-copy">Sales copy</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#media-seo">Media and SEO</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#pricing-checkout">Related offer and pricing</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#pages">Pages</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#curriculum">Curriculum</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#social-proof">Reviews and FAQ</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#publish">Publish and preview</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#migration-urls">Migration and URLs</a>
            </div>
          </Card>
          <div id="publish">
            <Card className="space-y-4 bg-white p-5">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Preview and publish</p>
                <p className="text-sm leading-6 text-stone-600">Use the public surfaces here, then publish when the content and commerce handoff are both ready.</p>
              </div>
              <div className="grid gap-3">
                <form action={regeneratePageAction}><input type="hidden" name="courseId" value={course.id} /><button className="w-full rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700" type="submit">Regenerate page</button></form>
                <HardLink href={publicPagePath} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">View sales page</HardLink>
                {previewOffer ? <HardLink href={`/checkout/${previewOffer.id}`} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">Preview checkout</HardLink> : null}
                <HardLink href={thankYouPagePath} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">View thank-you page</HardLink>
                {course.modules[0]?.lessons[0] ? (
                  <HardLink href={`/learn/${course.slug}/${course.modules[0].lessons[0].slug}`} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">
                    Preview learner view
                  </HardLink>
                ) : null}
                <form action={setCourseStatusAction}><input type="hidden" name="courseId" value={course.id} /><input type="hidden" name="status" value="PUBLISHED" /><button className="w-full rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700" type="submit">Publish</button></form>
                <form action={setCourseStatusAction}><input type="hidden" name="courseId" value={course.id} /><input type="hidden" name="status" value="DRAFT" /><button className="w-full rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700" type="submit">Unpublish</button></form>
                <form action={deleteCourseAction}><input type="hidden" name="courseId" value={course.id} /><button className="w-full rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700" type="submit">Delete course</button></form>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div id="curriculum">
          <details className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[var(--shadow-panel)]">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-stone-950">Curriculum</h2>
                <p className="text-sm text-stone-600">Expand only the module you need. Drip timing stays visible here without forcing the whole curriculum open.</p>
              </div>
              <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Toggle</span>
            </summary>
            <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Immediate lessons</span>
                <span className="mt-1 block text-base text-stone-950">{totalLessons - dripLessons}</span>
              </div>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Delayed lessons</span>
                <span className="mt-1 block text-base text-stone-950">{dripLessons}</span>
              </div>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Latest unlock day</span>
                <span className="mt-1 block text-base text-stone-950">{latestDripDay}</span>
              </div>
            </div>
            {course.modules.map((module) => (
              <details key={module.id} className="rounded-[24px] border border-stone-200 bg-stone-50 p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Module {module.position}</p>
                  <p className="mt-1 text-lg font-semibold text-stone-950">{module.title}</p>
                </div>
                <p className="text-sm text-stone-600">
                  {module.lessons.length} lesson{module.lessons.length === 1 ? "" : "s"} /{" "}
                  {module.lessons.filter((lesson) => (lesson.dripDays ?? 0) > 0).length > 0
                    ? `${module.lessons.filter((lesson) => (lesson.dripDays ?? 0) > 0).length} on drip`
                    : "all immediate"}
                </p>
              </summary>
              <div className="mt-4 space-y-4">
                <form action={addModuleAction} className="grid gap-3 rounded-[20px] border border-stone-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_120px_auto]">
                  <input type="hidden" name="courseId" value={course.id} />
                  <input type="hidden" name="moduleId" value={module.id} />
                  <label>Module title<input name="title" defaultValue={module.title} /></label>
                  <label>Position<input name="position" type="number" min="1" defaultValue={module.position} /></label>
                  <div className="flex flex-wrap items-end gap-3">
                    <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit">Save module</button>
                    <button className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700" type="submit" formAction={deleteModuleAction} name="moduleId" value={module.id}>Delete</button>
                  </div>
                </form>
                <div className="space-y-3">
                  {module.lessons.map((lesson) => (
                    <details key={lesson.id} className="rounded-[20px] border border-stone-200 bg-white p-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-stone-950">{lesson.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-stone-500">
                            {formatLessonType(lesson.type)} / {lesson.status} / {formatDripSummary(lesson.dripDays)}
                          </p>
                        </div>
                        <p className="text-sm text-stone-600">Open</p>
                      </summary>
                      <form action={addLessonAction} className="mt-4 grid gap-3">
                        <input type="hidden" name="courseId" value={course.id} />
                        <input type="hidden" name="moduleId" value={module.id} />
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <label>Lesson title<input name="title" defaultValue={lesson.title} /></label>
                          <label>Lesson slug<input name="slug" defaultValue={lesson.slug} /></label>
                          <label>Position<input name="position" type="number" min="1" defaultValue={lesson.position} /></label>
                          <label>Type<select name="type" defaultValue={lesson.type}><option value="VIDEO">VIDEO</option><option value="TEXT">TEXT</option><option value="DOWNLOAD">DOWNLOAD</option><option value="MIXED">MIXED</option></select></label>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <label>Text content<textarea name="content" rows={3} defaultValue={lesson.content ?? ""} /></label>
                          <label>
                            Video embed URL
                            <input name="videoUrl" defaultValue={lesson.videoUrl ?? ""} />
                            <span className="mt-1 block text-xs leading-5 text-stone-500">Paste either a direct video URL or the iframe embed code.</span>
                          </label>
                        </div>
                        <details className="rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-3">
                          <summary className="cursor-pointer text-sm font-medium text-stone-700">Advanced lesson fields</summary>
                          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <label>Download URL<input name="downloadUrl" defaultValue={lesson.downloadUrl ?? ""} /></label>
                            <label>Duration<input name="durationLabel" defaultValue={lesson.durationLabel ?? ""} /></label>
                            <label>
                              Unlock after enrollment (days)
                              <input name="dripDays" type="number" min="0" defaultValue={lesson.dripDays ?? ""} />
                            </label>
                            <label>Status<select name="status" defaultValue={lesson.status}><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option></select></label>
                          </div>
                          <div className="mt-3 space-y-2">
                            <p className="text-sm leading-6 text-stone-600">Leave blank or set 0 to make the lesson available immediately. Any positive number delays access from the learner&apos;s enrollment date.</p>
                            <label className="flex items-center gap-3 text-stone-700"><input className="w-auto" type="checkbox" name="isPreview" value="true" defaultChecked={lesson.isPreview} />Preview lesson</label>
                            <p className="text-sm leading-6 text-stone-600">Preview lessons get a public Watch preview link on the sales page. Leave this off for buyer-only lessons.</p>
                          </div>
                        </details>
                        <div className="flex flex-wrap gap-3">
                          <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit">Save lesson</button>
                          <button className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700" type="submit" formAction={deleteLessonAction} name="lessonId" value={lesson.id}>Delete</button>
                        </div>
                      </form>
                    </details>
                  ))}
                </div>
                <details className="rounded-[20px] border border-dashed border-stone-200 bg-white p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-stone-950">Add lesson</summary>
                  <form action={addLessonAction} className="mt-4 grid gap-3">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="moduleId" value={module.id} />
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <label>Lesson title<input name="title" /></label>
                      <label>Lesson slug<input name="slug" /></label>
                      <label>Position<input name="position" type="number" min="1" /></label>
                      <label>Type<select name="type" defaultValue="VIDEO"><option value="VIDEO">VIDEO</option><option value="TEXT">TEXT</option><option value="DOWNLOAD">DOWNLOAD</option><option value="MIXED">MIXED</option></select></label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label>Text content<textarea name="content" rows={3} /></label>
                      <label>
                        Video embed URL
                        <input name="videoUrl" />
                        <span className="mt-1 block text-xs leading-5 text-stone-500">Paste either a direct video URL or the iframe embed code.</span>
                      </label>
                    </div>
                    <button className="w-fit rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit">Create lesson</button>
                  </form>
                </details>
              </div>
            </details>
          ))}
            <details className="rounded-[24px] border border-dashed border-stone-200 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-stone-950">Add module</summary>
              <form action={addModuleAction} className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_auto]">
                <input type="hidden" name="courseId" value={course.id} />
                <label>Module title<input name="title" /></label>
                <label>Position<input name="position" type="number" min="1" /></label>
                <button className="w-fit rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit">Create module</button>
              </form>
            </details>
            </div>
          </details>
        </div>
        <div id="social-proof">
          <details className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[var(--shadow-panel)]">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-stone-950">FAQ and reviews</h2>
                <p className="text-sm text-stone-600">Keep public proof and objections inside the same product editor.</p>
              </div>
              <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Toggle</span>
            </summary>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                Live price: {course.price.toString()} {course.currency}
                {course.compareAtPrice ? ` · compare-at ${course.compareAtPrice.toString()} ${course.currency}` : ""}
              </div>
              <p className="pt-2 text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">FAQ</p>
            <form action={saveFaqAction} className="grid gap-3 rounded-[20px] border border-dashed border-stone-200 p-4">
              <input type="hidden" name="courseId" value={course.id} />
              <label>Question<input name="question" /></label>
              <label>Answer<textarea name="answer" rows={3} /></label>
              <label>Position<input name="position" type="number" min="1" defaultValue={course.faqs.length + 1} /></label>
              <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Add FAQ</button>
            </form>
            {course.faqs.map((faq) => (
              <form key={`${faq.id}-edit`} action={saveFaqAction} className="grid gap-3 rounded-[20px] border border-stone-200 p-4">
                <input type="hidden" name="faqId" value={faq.id} />
                <input type="hidden" name="courseId" value={course.id} />
                <label>Question<input name="question" defaultValue={faq.question} /></label>
                <label>Answer<textarea name="answer" rows={3} defaultValue={faq.answer} /></label>
                <label>Position<input name="position" type="number" min="1" defaultValue={faq.position} /></label>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Save FAQ</button>
                  <button className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700" type="submit" formAction={deleteFaqAction} name="faqId" value={faq.id}>Delete FAQ</button>
                </div>
              </form>
            ))}
            <p className="pt-2 text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Reviews</p>
            <form action={saveTestimonialAction} className="grid gap-3 rounded-[20px] border border-dashed border-stone-200 p-4">
              <input type="hidden" name="courseId" value={course.id} />
              <label>Name<input name="name" /></label>
              <label>Quote<textarea name="quote" rows={3} /></label>
              <label>Rating<input name="rating" type="number" min="1" max="5" defaultValue={5} /></label>
              <label>Position<input name="position" type="number" min="1" defaultValue={course.testimonials.length + 1} /></label>
              <label className="flex items-center gap-2"><input className="w-auto" name="isApproved" type="checkbox" value="true" defaultChecked />Approved</label>
              <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Add testimonial</button>
            </form>
            {course.testimonials.map((testimonial) => (
              <form key={`${testimonial.id}-edit`} action={saveTestimonialAction} className="grid gap-3 rounded-[20px] border border-stone-200 p-4">
                <input type="hidden" name="testimonialId" value={testimonial.id} />
                <input type="hidden" name="courseId" value={course.id} />
                <label>Name<input name="name" defaultValue={testimonial.name ?? ""} /></label>
                <label>Quote<textarea name="quote" rows={3} defaultValue={testimonial.quote} /></label>
                <label>Rating<input name="rating" type="number" min="1" max="5" defaultValue={testimonial.rating} /></label>
                <label>Position<input name="position" type="number" min="1" defaultValue={testimonial.position} /></label>
                <label className="flex items-center gap-2"><input className="w-auto" name="isApproved" type="checkbox" value="true" defaultChecked={testimonial.isApproved} />Approved</label>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Save testimonial</button>
                  <button className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700" type="submit" formAction={deleteTestimonialAction} name="testimonialId" value={testimonial.id}>Delete testimonial</button>
                </div>
              </form>
            ))}
          </div>
        </details>
        </div>
      </div>
    </AdminShell>
  );
}
