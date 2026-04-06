import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { ProductFormSection } from "@/components/admin/product-form-shell";
import { parseSalesPageConfig } from "@/lib/sales-pages/sales-page-config";
import {
  deleteBundleAction,
  deleteFaqAction,
  deleteOfferAction,
  deleteTestimonialAction,
  saveBundleAction,
  saveBundleCoursesAction,
  saveFaqAction,
  saveOfferAction,
  saveTestimonialAction,
} from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

export default async function BundleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [bundle, allCourses] = await Promise.all([
    prisma.bundle.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            course: true,
          },
          orderBy: { position: "asc" },
        },
        offers: true,
        faqs: { orderBy: { position: "asc" } },
        testimonials: { orderBy: { position: "asc" } },
      },
    }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
    }),
  ]);

  if (!bundle) {
    notFound();
  }

  const selectedCourseIds = new Set(bundle.courses.map((item) => item.courseId));
  const previewOffer = bundle.offers.find((offer) => offer.isPublished) ?? bundle.offers[0] ?? null;
  const salesPageConfig = parseSalesPageConfig(bundle.salesPageConfig);

  return (
    <AdminShell title={bundle.title} description="One product record controls the bundle page, included courses, pricing, and access.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <Card className="space-y-8 bg-white p-8">
          <div className="space-y-4 border-b border-[var(--border)] pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Product editor</p>
            <h2 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">Edit the product once and let the page generate from it.</h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">Bundles stay course-based underneath. This record defines the bundle promise, pricing, and public presentation.</p>
          </div>

          <form action={saveBundleAction} className="space-y-8">
            <input type="hidden" name="id" value={bundle.id} />

            <ProductFormSection
              title="Core identity"
              description="Title, route, and status."
            >
              <label>
                Title
                <input name="title" defaultValue={bundle.title} required />
              </label>
              <label>
                Slug
                <input name="slug" defaultValue={bundle.slug} required />
              </label>
              <label>
                Subtitle
                <input name="subtitle" defaultValue={bundle.subtitle ?? ""} />
              </label>
              <label>
                Status
                <select name="status" defaultValue={bundle.status}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </label>
            </ProductFormSection>

            <ProductFormSection
              title="Sales copy"
              description="Core page copy."
            >
              <label className="lg:col-span-2">
                Short description
                <textarea name="shortDescription" rows={4} defaultValue={bundle.shortDescription ?? ""} />
              </label>
              <label className="lg:col-span-2">
                Long description
                <textarea name="longDescription" rows={6} defaultValue={bundle.longDescription ?? ""} />
              </label>
              <label className="lg:col-span-2">
                Outcomes
                <textarea name="learningOutcomes" rows={4} defaultValue={(bundle.learningOutcomes as string[] | null)?.join("\n") ?? ""} />
              </label>
              <label>
                Who it&apos;s for
                <textarea name="whoItsFor" rows={4} defaultValue={(bundle.whoItsFor as string[] | null)?.join("\n") ?? ""} />
              </label>
              <label>
                Includes
                <textarea name="includes" rows={4} defaultValue={(bundle.includes as string[] | null)?.join("\n") ?? ""} />
              </label>
            </ProductFormSection>

            <ProductFormSection
              title="Media and SEO"
              description="Hero media and search."
            >
              <label>
                Hero image URL
                <input name="heroImageUrl" defaultValue={bundle.heroImageUrl ?? ""} />
              </label>
              <label>
                Sales video URL
                <input name="salesVideoUrl" defaultValue={bundle.salesVideoUrl ?? ""} />
              </label>
              <label>
                SEO title
                <input name="seoTitle" defaultValue={bundle.seoTitle ?? ""} />
              </label>
              <label className="lg:col-span-2">
                SEO description
                <textarea name="seoDescription" rows={3} defaultValue={bundle.seoDescription ?? ""} />
              </label>
            </ProductFormSection>

            <ProductFormSection
              title="Sales page"
              description="Section order and CTA copy."
            >
              <label>
                Hero metadata line
                <input name="salesPage.heroMetadataLine" defaultValue={salesPageConfig.heroMetadataLine ?? ""} />
              </label>
              <label>
                Primary CTA label
                <input name="salesPage.primaryCtaLabel" defaultValue={salesPageConfig.primaryCtaLabel ?? ""} />
              </label>
              <label>
                Secondary CTA label
                <input name="salesPage.secondaryCtaLabel" defaultValue={salesPageConfig.secondaryCtaLabel ?? ""} />
              </label>
              <label>
                Pricing badge
                <input name="salesPage.pricingBadge" defaultValue={salesPageConfig.pricingBadge ?? ""} />
              </label>
              <label className="lg:col-span-2">
                Pricing headline
                <input name="salesPage.pricingHeadline" defaultValue={salesPageConfig.pricingHeadline ?? ""} />
              </label>
              <label className="lg:col-span-2">
                Pricing body
                <textarea name="salesPage.pricingBody" rows={3} defaultValue={salesPageConfig.pricingBody ?? ""} />
              </label>
              <label>
                Final CTA label
                <input name="salesPage.finalCtaLabel" defaultValue={salesPageConfig.finalCtaLabel ?? ""} />
              </label>
              <label className="lg:col-span-2">
                Final CTA body
                <textarea name="salesPage.finalCtaBody" rows={3} defaultValue={salesPageConfig.finalCtaBody ?? ""} />
              </label>
              <label className="lg:col-span-2">
                Section order
                <textarea
                  name="salesPage.sectionOrder"
                  rows={6}
                  defaultValue={(salesPageConfig.sectionOrder ?? ["description", "highlights", "included-courses", "testimonials", "faqs", "pricing"]).join("\n")}
                />
              </label>
              <label className="lg:col-span-2">
                Hidden sections
                <textarea
                  name="salesPage.hiddenSections"
                  rows={6}
                  defaultValue={(salesPageConfig.hiddenSections ?? []).join("\n")}
                />
              </label>
            </ProductFormSection>

            <ProductFormSection
              title="Preserved URLs"
              description="Only use this when preserving an old live route."
            >
              <label className="lg:col-span-2">
                Legacy URL
                <input name="legacyUrl" defaultValue={bundle.legacyUrl ?? ""} />
              </label>
            </ProductFormSection>

            <div className="border-t border-[var(--border)] pt-6">
              <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">Save bundle</button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Product status</p>
            <div className="grid gap-3 text-sm text-stone-700">
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Current status</span>
                <span className="mt-1 block text-base font-semibold text-stone-950">{bundle.status}</span>
              </div>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Public path</span>
                <span className="mt-1 block break-all text-base text-stone-950">{bundle.publicPath ?? `/bundle/${bundle.slug}`}</span>
              </div>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Included courses</span>
                <span className="mt-1 block text-base text-stone-950">
                  {bundle.courses.length} course{bundle.courses.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Published offers</span>
                <span className="mt-1 block text-base text-stone-950">{bundle.offers.filter((offer) => offer.isPublished).length}</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-3 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Actions</p>
            <div className="grid gap-3">
              <Link href={bundle.publicPath ?? `/bundle/${bundle.slug}`} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">
                View public page
              </Link>
              {previewOffer ? (
                <Link href={`/checkout/${previewOffer.id}`} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">
                  Preview checkout
                </Link>
              ) : null}
              <button
                className="rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700"
                type="submit"
                formAction={deleteBundleAction}
                form="bundle-editor-actions"
                name="bundleId"
                value={bundle.id}
              >
                Delete bundle
              </button>
            </div>
          </Card>
          <form id="bundle-editor-actions">
            <input type="hidden" name="bundleId" value={bundle.id} />
          </form>
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
                <span>
                  <span className="block font-semibold text-stone-950">{course.title}</span>
                  {course.subtitle ? <span className="block text-sm text-stone-700">{course.subtitle}</span> : null}
                </span>
              </label>
            ))}
            <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Save included courses</button>
          </form>
        </Card>

        <Card className="space-y-6 bg-white">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-950">Pricing, FAQ, and reviews</h2>
            <p className="text-sm text-stone-600">Keep the bundle commerce details in one place.</p>
          </div>
          <div className="space-y-3 text-sm text-stone-700">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Pricing</h3>
              {bundle.offers.map((offer) => (
                <div key={`summary-${offer.id}`} className="rounded-[20px] bg-stone-50 px-4 py-3">
                  {offer.name} · {offer.price.toString()} {offer.currency}
                </div>
              ))}
            </div>
            <form action={saveOfferAction} className="grid gap-3 rounded-[20px] border border-dashed border-stone-200 p-4">
              <input type="hidden" name="bundleId" value={bundle.id} />
              <label>
                Offer name
                <input name="name" />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label>
                  Offer type
                  <select name="type" defaultValue="ONE_TIME">
                    <option value="ONE_TIME">ONE_TIME</option>
                    <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                    <option value="PAYMENT_PLAN">PAYMENT_PLAN</option>
                  </select>
                </label>
                <label>
                  Price
                  <input name="price" type="number" step="0.01" />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label>
                  Currency
                  <input name="currency" defaultValue="USD" />
                </label>
                <label>
                  Checkout path
                  <input name="checkoutPath" />
                </label>
              </div>
              <label className="flex items-center gap-3 text-stone-700">
                <input className="w-auto" type="checkbox" name="isPublished" value="true" defaultChecked />
                Published
              </label>
              <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Add offer</button>
            </form>
            {bundle.offers.map((offer) => (
              <form key={offer.id} action={saveOfferAction} className="grid gap-3 rounded-[20px] border border-stone-200 p-4">
                <input type="hidden" name="id" value={offer.id} />
                <input type="hidden" name="bundleId" value={bundle.id} />
                <label>
                  Offer name
                  <input name="name" defaultValue={offer.name} />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label>
                    Offer type
                    <select name="type" defaultValue={offer.type}>
                      <option value="ONE_TIME">ONE_TIME</option>
                      <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                      <option value="PAYMENT_PLAN">PAYMENT_PLAN</option>
                    </select>
                  </label>
                  <label>
                    Price
                    <input name="price" type="number" step="0.01" defaultValue={offer.price.toString()} />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label>
                    Currency
                    <input name="currency" defaultValue={offer.currency} />
                  </label>
                  <label>
                    Checkout path
                    <input name="checkoutPath" defaultValue={offer.checkoutPath ?? ""} />
                  </label>
                </div>
                <label className="flex items-center gap-3 text-stone-700">
                  <input className="w-auto" type="checkbox" name="isPublished" value="true" defaultChecked={offer.isPublished} />
                  Published
                </label>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Save offer</button>
                  <button
                    className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
                    type="submit"
                    formAction={deleteOfferAction}
                    name="offerId"
                    value={offer.id}
                  >
                    Delete offer
                  </button>
                </div>
              </form>
            ))}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">FAQ</h3>
              {bundle.faqs.map((faq) => (
                <div key={`summary-${faq.id}`} className="rounded-[20px] bg-stone-50 px-4 py-3">
                  {faq.question}
                </div>
              ))}
            </div>
            <form action={saveFaqAction} className="grid gap-3 rounded-[20px] border border-dashed border-stone-200 p-4">
              <input type="hidden" name="bundleId" value={bundle.id} />
              <label>
                Question
                <input name="question" />
              </label>
              <label>
                Answer
                <textarea name="answer" rows={3} />
              </label>
              <label>
                Position
                <input name="position" type="number" min="1" defaultValue={bundle.faqs.length + 1} />
              </label>
              <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Add FAQ</button>
            </form>
            {bundle.faqs.map((faq) => (
              <form key={faq.id} action={saveFaqAction} className="grid gap-3 rounded-[20px] border border-stone-200 p-4">
                <input type="hidden" name="faqId" value={faq.id} />
                <input type="hidden" name="bundleId" value={bundle.id} />
                <label>
                  Question
                  <input name="question" defaultValue={faq.question} />
                </label>
                <label>
                  Answer
                  <textarea name="answer" rows={3} defaultValue={faq.answer} />
                </label>
                <label>
                  Position
                  <input name="position" type="number" min="1" defaultValue={faq.position} />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Save FAQ</button>
                  <button
                    className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
                    type="submit"
                    formAction={deleteFaqAction}
                    name="faqId"
                    value={faq.id}
                  >
                    Delete FAQ
                  </button>
                </div>
              </form>
            ))}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Reviews</h3>
              {bundle.testimonials.map((testimonial) => (
                <div key={`summary-${testimonial.id}`} className="rounded-[20px] bg-stone-50 px-4 py-3">
                  {testimonial.quote}
                </div>
              ))}
            </div>
            <form action={saveTestimonialAction} className="grid gap-3 rounded-[20px] border border-dashed border-stone-200 p-4">
              <input type="hidden" name="bundleId" value={bundle.id} />
              <label>
                Name
                <input name="name" />
              </label>
              <label>
                Quote
                <textarea name="quote" rows={3} />
              </label>
              <label>
                Position
                <input name="position" type="number" min="1" defaultValue={bundle.testimonials.length + 1} />
              </label>
              <label className="flex items-center gap-2">
                <input className="w-auto" name="isApproved" type="checkbox" value="true" defaultChecked />
                Approved
              </label>
              <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Add testimonial</button>
            </form>
            {bundle.testimonials.map((testimonial) => (
              <form key={testimonial.id} action={saveTestimonialAction} className="grid gap-3 rounded-[20px] border border-stone-200 p-4">
                <input type="hidden" name="testimonialId" value={testimonial.id} />
                <input type="hidden" name="bundleId" value={bundle.id} />
                <label>
                  Name
                  <input name="name" defaultValue={testimonial.name ?? ""} />
                </label>
                <label>
                  Quote
                  <textarea name="quote" rows={3} defaultValue={testimonial.quote} />
                </label>
                <label>
                  Position
                  <input name="position" type="number" min="1" defaultValue={testimonial.position} />
                </label>
                <label className="flex items-center gap-2">
                  <input className="w-auto" name="isApproved" type="checkbox" value="true" defaultChecked={testimonial.isApproved} />
                  Approved
                </label>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Save testimonial</button>
                  <button
                    className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
                    type="submit"
                    formAction={deleteTestimonialAction}
                    name="testimonialId"
                    value={testimonial.id}
                  >
                    Delete testimonial
                  </button>
                </div>
              </form>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
