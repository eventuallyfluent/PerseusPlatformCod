import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { ImageField } from "@/components/admin/image-field";
import { ProductFormSection } from "@/components/admin/product-form-shell";
import { parseSalesPageConfig } from "@/lib/sales-pages/sales-page-config";
import { resolveBundlePublicPath } from "@/lib/urls/resolve-bundle-path";
import { getPrimaryOffer } from "@/lib/offers/sync-product-offer";
import { deleteBundleAction, deleteFaqAction, deleteTestimonialAction, saveBundleAction, saveBundleCoursesAction, saveFaqAction, saveTestimonialAction } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

export default async function BundleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string }>;
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
  const salesPageConfig = parseSalesPageConfig(bundle.salesPageConfig);
  const upsellTarget = bundle.upsellCourseId ? `course:${bundle.upsellCourseId}` : bundle.upsellBundleId ? `bundle:${bundle.upsellBundleId}` : "";
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
            : "";

  return (
    <AdminShell title={bundle.title} description="One product record controls the bundle page, included courses, pricing, and access.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <Card className="space-y-8 bg-white p-8">
          {feedbackMessage ? <p className="rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedbackMessage}</p> : null}
          <div className="space-y-4 border-b border-[var(--border)] pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Product editor</p>
            <h2 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">Edit the product once and let the page generate from it.</h2>
          </div>
          <form id="bundle-details-form" action={saveBundleAction} className="space-y-8">
            <input type="hidden" name="id" value={bundle.id} />
            <ProductFormSection title="Core identity" description="Title, route, and status.">
              <label>Title<input name="title" defaultValue={bundle.title} required /></label>
              <label>Slug<input name="slug" defaultValue={bundle.slug} required /></label>
              <label>Subtitle<input name="subtitle" defaultValue={bundle.subtitle ?? ""} /></label>
              <label>Status<select name="status" defaultValue={bundle.status}><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option><option value="ARCHIVED">ARCHIVED</option></select></label>
            </ProductFormSection>
            <ProductFormSection title="Sales copy" description="Core page copy.">
              <label className="lg:col-span-2">Short description<textarea name="shortDescription" rows={4} defaultValue={bundle.shortDescription ?? ""} /></label>
              <label className="lg:col-span-2">Long description<textarea name="longDescription" rows={6} defaultValue={bundle.longDescription ?? ""} /></label>
              <label className="lg:col-span-2">Outcomes<textarea name="learningOutcomes" rows={4} defaultValue={(bundle.learningOutcomes as string[] | null)?.join("\n") ?? ""} /></label>
              <label>Who it&apos;s for<textarea name="whoItsFor" rows={4} defaultValue={(bundle.whoItsFor as string[] | null)?.join("\n") ?? ""} /></label>
              <label>Includes<textarea name="includes" rows={4} defaultValue={(bundle.includes as string[] | null)?.join("\n") ?? ""} /></label>
            </ProductFormSection>
            <ProductFormSection title="Media and SEO" description="Hero media and search.">
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
            <ProductFormSection title="Pricing" description="Set the live bundle price here. Coupons apply discounts at checkout.">
              <label>Price<input name="price" type="number" min="0" step="0.01" defaultValue={bundle.price.toString()} /></label>
              <label>Currency<input name="currency" defaultValue={bundle.currency} /></label>
              <label>Compare-at price<input name="compareAtPrice" type="number" min="0" step="0.01" defaultValue={bundle.compareAtPrice?.toString() ?? ""} /></label>
              <label className="lg:col-span-2">
                Checkout upsell
                <select name="upsellTarget" defaultValue={upsellTarget}>
                  <option value="">No upsell</option>
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
                Upsell discount type
                <select name="upsellDiscountType" defaultValue={bundle.upsellDiscountType}>
                  <option value="NONE">No upsell discount</option>
                  <option value="AMOUNT">Amount off</option>
                  <option value="PERCENT">Percent off</option>
                </select>
              </label>
              <label>
                Upsell discount value
                <input name="upsellDiscountValue" type="number" min="0.01" step="0.01" defaultValue={bundle.upsellDiscountValue?.toString() ?? ""} />
              </label>
              <label className="lg:col-span-2">Upsell headline<input name="upsellHeadline" defaultValue={bundle.upsellHeadline ?? ""} placeholder="Optional override for the upsell title" /></label>
              <label className="lg:col-span-2">Upsell body<textarea name="upsellBody" rows={3} defaultValue={bundle.upsellBody ?? ""} placeholder="Explain the discounted follow-up offer clearly." /></label>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-700">Checkout reads the bundle price directly. Use coupons for discounts and configure one optional upsell with its own discounted follow-up offer.</div>
            </ProductFormSection>
            <ProductFormSection title="Sales page" description="Section order and CTA copy.">
              <label>Hero metadata line<input name="salesPage.heroMetadataLine" defaultValue={salesPageConfig.heroMetadataLine ?? ""} /></label>
              <label>Primary CTA label<input name="salesPage.primaryCtaLabel" defaultValue={salesPageConfig.primaryCtaLabel ?? ""} /></label>
              <label>Secondary CTA label<input name="salesPage.secondaryCtaLabel" defaultValue={salesPageConfig.secondaryCtaLabel ?? ""} /></label>
              <label>Pricing badge<input name="salesPage.pricingBadge" defaultValue={salesPageConfig.pricingBadge ?? ""} /></label>
              <label className="lg:col-span-2">Pricing headline<input name="salesPage.pricingHeadline" defaultValue={salesPageConfig.pricingHeadline ?? ""} /></label>
              <label className="lg:col-span-2">Pricing body<textarea name="salesPage.pricingBody" rows={3} defaultValue={salesPageConfig.pricingBody ?? ""} /></label>
              <label>Final CTA label<input name="salesPage.finalCtaLabel" defaultValue={salesPageConfig.finalCtaLabel ?? ""} /></label>
              <label className="lg:col-span-2">Final CTA body<textarea name="salesPage.finalCtaBody" rows={3} defaultValue={salesPageConfig.finalCtaBody ?? ""} /></label>
              <label className="lg:col-span-2">Section order<textarea name="salesPage.sectionOrder" rows={6} defaultValue={(salesPageConfig.sectionOrder ?? ["description", "highlights", "included-courses", "testimonials", "faqs", "pricing"]).join("\n")} /></label>
              <label className="lg:col-span-2">Hidden sections<textarea name="salesPage.hiddenSections" rows={6} defaultValue={(salesPageConfig.hiddenSections ?? []).join("\n")} /></label>
            </ProductFormSection>
            <ProductFormSection title="Preserved URLs" description="Only use this when preserving an old live route.">
              <label className="lg:col-span-2">Legacy URL<input name="legacyUrl" defaultValue={bundle.legacyUrl ?? ""} /></label>
            </ProductFormSection>
            <div className="border-t border-[var(--border)] pt-6"><button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">Save bundle</button></div>
          </form>
        </Card>
        <div className="space-y-4">
          <Card className="space-y-4 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Product status</p>
            <div className="grid gap-3 text-sm text-stone-700">
              <button
                className="w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50"
                type="submit"
                form="bundle-details-form"
              >
                Save bundle changes
              </button>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Current status</span><span className="mt-1 block text-base font-semibold text-stone-950">{bundle.status}</span></div>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Public path</span><span className="mt-1 block break-all text-base text-stone-950">{resolveBundlePublicPath(bundle)}</span></div>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Included courses</span><span className="mt-1 block text-base text-stone-950">{bundle.courses.length} course{bundle.courses.length === 1 ? "" : "s"}</span></div>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3"><span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Live price</span><span className="mt-1 block text-base text-stone-950">{bundle.price.toString()} {bundle.currency}</span></div>
            </div>
          </Card>
          <Card className="space-y-3 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Actions</p>
            <div className="grid gap-3">
              <Link href={resolveBundlePublicPath(bundle)} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">View public page</Link>
              {previewOffer ? <Link href={`/checkout/${previewOffer.id}`} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">Preview checkout</Link> : null}
              <button className="rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700" type="submit" formAction={deleteBundleAction} form="bundle-editor-actions" name="bundleId" value={bundle.id}>Delete bundle</button>
            </div>
          </Card>
          <form id="bundle-editor-actions"><input type="hidden" name="bundleId" value={bundle.id} /></form>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="space-y-4 bg-white">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-950">Included courses</h2>
            <p className="text-sm text-stone-600">Select the courses this bundle unlocks.</p>
          </div>
          <form action={saveBundleCoursesAction} className="space-y-3">
            <input type="hidden" name="bundleId" value={bundle.id} />
            {allCourses.map((course) => (
              <label key={course.id} className="flex items-start gap-3 rounded-[20px] border border-stone-200 bg-white px-4 py-4 text-stone-700">
                <input className="mt-1 w-auto" type="checkbox" name="courseIds" value={course.id} defaultChecked={selectedCourseIds.has(course.id)} />
                <span><span className="block font-semibold text-stone-950">{course.title}</span>{course.subtitle ? <span className="block text-sm text-stone-700">{course.subtitle}</span> : null}</span>
              </label>
            ))}
            <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Save included courses</button>
          </form>
        </Card>
        <Card className="space-y-6 bg-white">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-950">FAQ and reviews</h2>
            <p className="text-sm text-stone-600">Keep public proof and objections inside the same product editor.</p>
          </div>
          <div className="space-y-3 text-sm text-stone-700">
            <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">Live price: {bundle.price.toString()} {bundle.currency}{bundle.compareAtPrice ? ` · compare-at ${bundle.compareAtPrice.toString()} ${bundle.currency}` : ""}</div>
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
        </Card>
      </div>
    </AdminShell>
  );
}
