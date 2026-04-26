import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { ImageField } from "@/components/admin/image-field";
import { ProductFormSection } from "@/components/admin/product-form-shell";
import { BundleCoursePicker } from "@/components/admin/bundle-course-picker";
import { RelatedOfferPicker } from "@/components/admin/related-offer-picker";
import { HardLink } from "@/components/ui/hard-link";
import { parseSalesPageConfig } from "@/lib/sales-pages/sales-page-config";
import { resolveBundlePublicPath, resolveBundleThankYouPath } from "@/lib/urls/resolve-bundle-path";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";
import { deleteBundleAction, deleteFaqAction, deleteTestimonialAction, saveBundleAction, saveBundleCoursesAction, saveFaqAction, saveTestimonialAction } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

export default async function BundleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const uploadEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [bundle, allCourses, upsellCourses, upsellBundles] = await Promise.all([
    prisma.bundle.findUnique({
      where: { id },
      include: {
        upsellCourse: true,
        upsellBundle: true,
        courses: { include: { course: true }, orderBy: { position: "asc" } },
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
      },
    }),
    prisma.course.findMany({ orderBy: { title: "asc" } }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    prisma.bundle.findMany({
      where: { id: { not: id } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!bundle) notFound();
  const selectedCourseIds = new Set(bundle.courses.map((item) => item.courseId));
  const previewOffer = getPrimaryOffer(bundle.offers);
  const publicPagePath = resolveBundlePublicPath(bundle);
  const thankYouPagePath = resolveBundleThankYouPath(bundle);
  const canonicalPathLocked =
    Boolean(bundle.legacyUrl?.startsWith("/")) || Boolean(bundle.publicPath?.startsWith("/") && bundle.publicPath !== `/bundle/${bundle.slug}`);
  const salesPageConfig = parseSalesPageConfig(bundle.salesPageConfig);
  const upsellTarget = bundle.upsellCourseId ? `course:${bundle.upsellCourseId}` : bundle.upsellBundleId ? `bundle:${bundle.upsellBundleId}` : "";
  const relatedOfferLabel = bundle.upsellCourse?.title ?? bundle.upsellBundle?.title ?? null;
  const saved = resolvedSearchParams?.saved ?? "";
  const feedbackMessage =
    saved === "details"
      ? "Bundle details saved."
      : saved === "courses"
        ? "Included courses saved."
        : saved === "faq"
          ? "FAQ updated."
          : saved === "reviews"
            ? "Reviews updated."
            : saved === "offer"
              ? "Checkout offer updated."
            : "";
  const errorMessage = resolvedSearchParams?.error === "details" ? "Bundle changes could not be saved. Check the form fields and try again." : "";
  const detailedErrorMessage =
    errorMessage ||
    (resolvedSearchParams?.error === "courses"
      ? "Included courses could not be saved. Try that section again."
      : resolvedSearchParams?.error === "faq"
        ? "FAQ changes could not be saved. Try that section again."
        : resolvedSearchParams?.error === "reviews"
          ? "Review changes could not be saved. Try that section again."
          : resolvedSearchParams?.error === "offer"
            ? "The checkout offer could not be updated. Try again."
          : resolvedSearchParams?.error === "delete"
            ? "The bundle could not be deleted. Remove dependent records first and try again."
            : "");

  return (
    <AdminShell title={bundle.title} description="Edit the bundle content here. Pricing, checkout, and unlock rules live on the linked product.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <div className="space-y-6">
        <Card className="space-y-8 bg-white p-8">
          {feedbackMessage ? <p className="rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedbackMessage}</p> : null}
          {detailedErrorMessage ? <p className="rounded-[18px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{detailedErrorMessage}</p> : null}
          <div className="space-y-4 border-b border-[var(--border)] pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Bundle content</p>
            <h2 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">Manage the bundle itself here, then use the product for commerce settings.</h2>
          </div>
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-900">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">Canonical public URL</span>
            <span className="mt-2 block break-all font-semibold text-stone-950">{publicPagePath}</span>
            <p className="mt-2">This is the live SEO path for this migrated bundle. Routine edits do not change it.</p>
          </div>
          <form id="bundle-details-form" action={saveBundleAction} className="space-y-8">
            <input type="hidden" name="id" value={bundle.id} />
            <ProductFormSection id="core-identity" title="Core identity" description="Title, route, and status." collapsible>
              <label>Title<input name="title" defaultValue={bundle.title} required /></label>
              <label>Slug<input name="slug" defaultValue={bundle.slug} required /></label>
              <label>Subtitle<input name="subtitle" defaultValue={bundle.subtitle ?? ""} /></label>
              <label>Status<select name="status" defaultValue={bundle.status}><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option><option value="ARCHIVED">ARCHIVED</option></select></label>
            </ProductFormSection>
            <ProductFormSection id="sales-copy" title="Sales copy" description="Core page copy." collapsible>
              <label className="lg:col-span-2">Short description<textarea name="shortDescription" rows={4} defaultValue={bundle.shortDescription ?? ""} /></label>
              <label className="lg:col-span-2">Long description<textarea name="longDescription" rows={6} defaultValue={bundle.longDescription ?? ""} /></label>
              <label className="lg:col-span-2">Outcomes<textarea name="learningOutcomes" rows={4} defaultValue={(bundle.learningOutcomes as string[] | null)?.join("\n") ?? ""} /></label>
              <label>Who it&apos;s for<textarea name="whoItsFor" rows={4} defaultValue={(bundle.whoItsFor as string[] | null)?.join("\n") ?? ""} /></label>
              <label>Includes<textarea name="includes" rows={4} defaultValue={(bundle.includes as string[] | null)?.join("\n") ?? ""} /></label>
            </ProductFormSection>
            <ProductFormSection id="media-seo" title="Media and SEO" description="Hero media and search." collapsible>
              <ImageField
                name="heroImageUrl"
                label="Bundle cover image URL"
                defaultValue={bundle.heroImageUrl}
                previewLabel="Current cover preview"
                uploadFolder="bundles"
                uploadEnabled={uploadEnabled}
              />
              <label>Sales video URL<input name="salesVideoUrl" defaultValue={bundle.salesVideoUrl ?? ""} /></label>
              <label>SEO title<input name="seoTitle" defaultValue={bundle.seoTitle ?? ""} /></label>
              <label className="lg:col-span-2">SEO description<textarea name="seoDescription" rows={3} defaultValue={bundle.seoDescription ?? ""} /></label>
            </ProductFormSection>
            <ProductFormSection
              id="related-offer"
              title="Related offer"
              description="Choose one follow-up recommendation for buyers. Price, checkout, and access rules live on the linked product."
              collapsible
            >
              <div className="lg:col-span-2">
                <span className="mb-2 block text-sm font-medium text-stone-700">Related follow-up offer</span>
                <RelatedOfferPicker
                  selectedValue={upsellTarget}
                  options={[
                    ...upsellCourses.map((upsellCourse) => ({
                      value: `course:${upsellCourse.id}`,
                      label: upsellCourse.title,
                      kind: "course" as const,
                    })),
                    ...upsellBundles.map((upsellBundle) => ({
                      value: `bundle:${upsellBundle.id}`,
                      label: upsellBundle.title,
                      kind: "bundle" as const,
                    })),
                  ]}
                />
              </div>
              <label>
                Related-offer discount type
                <select name="upsellDiscountType" defaultValue={bundle.upsellDiscountType}>
                  <option value="NONE">No discount</option>
                  <option value="AMOUNT">Amount off</option>
                  <option value="PERCENT">Percent off</option>
                </select>
              </label>
              <label>
                Related-offer discount value
                <input name="upsellDiscountValue" type="number" min="0.01" step="0.01" defaultValue={bundle.upsellDiscountValue?.toString() ?? ""} />
              </label>
              <label className="lg:col-span-2">Related-offer headline<input name="upsellHeadline" defaultValue={bundle.upsellHeadline ?? ""} placeholder="Optional override for the follow-up offer title" /></label>
              <label className="lg:col-span-2">Related-offer body<textarea name="upsellBody" rows={3} defaultValue={bundle.upsellBody ?? ""} placeholder="Explain why this is the next recommended offer." /></label>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-700">
                Keep this to one clear next offer. Use the linked product when you need to change pricing, checkout execution, or what access a purchase grants.
              </div>
            </ProductFormSection>
            <ProductFormSection
              id="pages"
              title="Pages"
              description="This is the public page summary for this bundle. Sales and checkout copy comes from the bundle content above."
              collapsible
            >
              <div className="lg:col-span-2 rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-700">
                Edit the bundle once above, then use the right-side page actions to view the public surfaces. The only editable copy here is the thank-you page.
              </div>
              <label>Thank-you eyebrow<input name="salesPage.thankYouEyebrow" defaultValue={salesPageConfig.thankYouEyebrow ?? ""} /></label>
              <label>Signed-in CTA label<input name="salesPage.thankYouSignedInLabel" defaultValue={salesPageConfig.thankYouSignedInLabel ?? ""} /></label>
              <label>Signed-out CTA label<input name="salesPage.thankYouSignedOutLabel" defaultValue={salesPageConfig.thankYouSignedOutLabel ?? ""} /></label>
              <label className="lg:col-span-2">Thank-you headline<input name="salesPage.thankYouHeadline" defaultValue={salesPageConfig.thankYouHeadline ?? ""} /></label>
              <label className="lg:col-span-2">Thank-you body<textarea name="salesPage.thankYouBody" rows={3} defaultValue={salesPageConfig.thankYouBody ?? ""} /></label>
            </ProductFormSection>
            <ProductFormSection id="migration-urls" title="Preserved URLs" description="This public route is SEO-critical for migrated content and should be treated as the canonical path." collapsible>
              {canonicalPathLocked ? (
                <>
                  <input type="hidden" name="legacyUrl" value={bundle.legacyUrl ?? ""} />
                  <label className="lg:col-span-2">Canonical public URL<input name="legacyUrlDisplay" value={publicPagePath} readOnly /></label>
                  <div className="lg:col-span-2 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
                    This migrated bundle route is locked because it is live and SEO-critical. Perseus keeps serving this exact URL after migration.
                  </div>
                </>
              ) : (
                <>
                  <label className="lg:col-span-2">Canonical public URL<input name="legacyUrl" defaultValue={bundle.legacyUrl ?? ""} /></label>
                  <div className="lg:col-span-2 rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-700">
                    Use a custom public URL only when preserving an existing live route. This affects the canonical path search engines and backlinks use.
                  </div>
                </>
              )}
            </ProductFormSection>
            <div className="border-t border-[var(--border)] pt-6"><button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">Save bundle</button></div>
          </form>
        </Card>
        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="space-y-5 bg-white p-5">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Content workspace</p>
              <h3 className="text-lg font-semibold text-stone-950">Keep bundle editing here. Use the linked product for commerce.</h3>
            </div>
            <div className="grid gap-3 text-sm text-stone-700">
              <button
                className="w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50"
                type="submit"
                form="bundle-details-form"
              >
                Save bundle changes
              </button>
              {bundle.accessProduct ? (
                <div className="rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-4">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Linked product</span>
                  <span className="mt-1 block text-base font-semibold text-stone-950">{bundle.accessProduct.title}</span>
                  <p className="mt-2 text-sm leading-6 text-stone-600">Pricing, checkout flow, and unlock rules live on the product side.</p>
                  <HardLink href={`/admin/products/${bundle.accessProduct.id}`} className="mt-3 inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-stone-50">
                    Manage product
                  </HardLink>
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Current status</span><span className="mt-1 block text-base font-semibold text-stone-950">{bundle.status}</span></div>
                <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Included courses</span><span className="mt-1 block text-base text-stone-950">{bundle.courses.length} course{bundle.courses.length === 1 ? "" : "s"}</span></div>
                <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Related offer</span><span className="mt-1 block text-base text-stone-950">{relatedOfferLabel ?? "No follow-up offer set"}</span></div>
                <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">Canonical URL</span><span className="mt-1 block break-all text-base text-stone-950">{publicPagePath}</span></div>
                <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Sales page</span><span className="mt-1 block break-all text-base text-stone-950">{publicPagePath}</span></div>
                <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Thank-you page</span><span className="mt-1 block break-all text-base text-stone-950">{thankYouPagePath}</span></div>
              </div>
            </div>
          </Card>
          <Card className="space-y-4 bg-white p-5">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Page structure</p>
              <p className="text-sm leading-6 text-stone-600">Jump straight to the section you need instead of working through the bundle as one long form.</p>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-1">
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#core-identity">Core identity</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#sales-copy">Sales copy</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#media-seo">Media and SEO</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#related-offer">Related offer</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#pages">Pages</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#included-courses">Included courses</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#social-proof">Reviews and FAQ</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#migration-urls">Preserved URLs</a>
              <a className="rounded-[16px] border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700 transition hover:border-stone-400 hover:text-stone-950" href="#publish">Publish and preview</a>
            </div>
          </Card>
          <div id="publish">
          <Card className="space-y-4 bg-white p-5">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Preview and publish</p>
              <p className="text-sm leading-6 text-stone-600">Use the public surfaces here, then return to the linked product when you need to change checkout or access behavior.</p>
            </div>
            <div className="grid gap-3">
              <HardLink href={publicPagePath} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">View sales page</HardLink>
              {previewOffer ? <HardLink href={`/checkout/${previewOffer.id}`} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">Preview checkout</HardLink> : null}
              <HardLink href={thankYouPagePath} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">View thank-you page</HardLink>
              <button className="rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700" type="submit" formAction={deleteBundleAction} form="bundle-editor-actions" name="bundleId" value={bundle.id}>Delete bundle</button>
            </div>
          </Card>
          </div>
          <form id="bundle-editor-actions"><input type="hidden" name="bundleId" value={bundle.id} /></form>
        </div>
        </div>
      </div>

      <div className="grid gap-6">
        <details id="included-courses" className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[var(--shadow-panel)]">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-stone-950">Included courses</h2>
              <p className="text-sm text-stone-600">Select the courses this bundle unlocks.</p>
            </div>
            <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Toggle</span>
          </summary>
          <form action={saveBundleCoursesAction} className="mt-4 space-y-4">
            <input type="hidden" name="bundleId" value={bundle.id} />
            <BundleCoursePicker
              courses={allCourses}
              selectedIds={[...selectedCourseIds]}
              emptyLabel="No courses match this search."
            />
            <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Save included courses</button>
          </form>
        </details>
        <details id="social-proof" className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[var(--shadow-panel)]">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-stone-950">FAQ and reviews</h2>
              <p className="text-sm text-stone-600">Keep public proof and objections inside the same product editor.</p>
            </div>
            <span className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Toggle</span>
          </summary>
          <div className="mt-4 space-y-3 text-sm text-stone-700">
            <div className="space-y-3 pt-2"><h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">FAQ</h3>{bundle.faqs.map((faq) => <div key={`summary-${faq.id}`} className="rounded-[20px] bg-stone-50 px-4 py-3">{faq.question}</div>)}</div>
            <form action={saveFaqAction} className="grid gap-3 rounded-[20px] border border-dashed border-stone-200 p-4">
              <input type="hidden" name="bundleId" value={bundle.id} />
              <label>Question<input name="question" /></label>
              <label>Answer<textarea name="answer" rows={3} /></label>
              <label>Position<input name="position" type="number" min="1" defaultValue={bundle.faqs.length + 1} /></label>
              <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Add FAQ</button>
            </form>
            {bundle.faqs.map((faq) => (
              <form key={faq.id} action={saveFaqAction} className="grid gap-3 rounded-[20px] border border-stone-200 p-4">
                <input type="hidden" name="faqId" value={faq.id} />
                <input type="hidden" name="bundleId" value={bundle.id} />
                <label>Question<input name="question" defaultValue={faq.question} /></label>
                <label>Answer<textarea name="answer" rows={3} defaultValue={faq.answer} /></label>
                <label>Position<input name="position" type="number" min="1" defaultValue={faq.position} /></label>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Save FAQ</button>
                  <button className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700" type="submit" formAction={deleteFaqAction} name="faqId" value={faq.id}>Delete FAQ</button>
                </div>
              </form>
            ))}
            <div className="space-y-3 pt-2"><h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Reviews</h3>{bundle.testimonials.map((testimonial) => <div key={`summary-${testimonial.id}`} className="rounded-[20px] bg-stone-50 px-4 py-3">{testimonial.quote}</div>)}</div>
            <form action={saveTestimonialAction} className="grid gap-3 rounded-[20px] border border-dashed border-stone-200 p-4">
              <input type="hidden" name="bundleId" value={bundle.id} />
              <label>Name<input name="name" /></label>
              <label>Quote<textarea name="quote" rows={3} /></label>
              <label>Rating<input name="rating" type="number" min="1" max="5" defaultValue={5} /></label>
              <label>Position<input name="position" type="number" min="1" defaultValue={bundle.testimonials.length + 1} /></label>
              <label className="flex items-center gap-2"><input className="w-auto" name="isApproved" type="checkbox" value="true" defaultChecked />Approved</label>
              <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Add testimonial</button>
            </form>
            {bundle.testimonials.map((testimonial) => (
              <form key={testimonial.id} action={saveTestimonialAction} className="grid gap-3 rounded-[20px] border border-stone-200 p-4">
                <input type="hidden" name="testimonialId" value={testimonial.id} />
                <input type="hidden" name="bundleId" value={bundle.id} />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                    {testimonial.email ? "Learner review" : "Imported review"}
                  </span>
                  {testimonial.email ? <span className="text-xs text-stone-500">{testimonial.email}</span> : null}
                </div>
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
    </AdminShell>
  );
}

