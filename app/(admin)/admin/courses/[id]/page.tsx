import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { ProductFormSection } from "@/components/admin/product-form-shell";
import { parseSalesPageConfig } from "@/lib/sales-pages/sales-page-config";
import {
  addLessonAction,
  addModuleAction,
  deleteCourseAction,
  deleteFaqAction,
  deleteLessonAction,
  deleteModuleAction,
  deleteOfferAction,
  deleteTestimonialAction,
  regeneratePageAction,
  saveCourseAction,
  saveFaqAction,
  saveOfferAction,
  saveTestimonialAction,
  setCourseStatusAction,
} from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

function formatLessonType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [course, instructors] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        instructor: true,
        modules: {
          include: {
            lessons: {
              orderBy: { position: "asc" },
            },
          },
          orderBy: { position: "asc" },
        },
        offers: true,
        faqs: { orderBy: { position: "asc" } },
        testimonials: { orderBy: { position: "asc" } },
        pages: true,
      },
    }),
    prisma.instructor.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!course) {
    notFound();
  }

  const previewOffer = course.offers.find((offer) => offer.isPublished) ?? course.offers[0] ?? null;
  const salesPageConfig = parseSalesPageConfig(course.salesPageConfig);

  return (
    <AdminShell title={course.title} description="One product record controls the page, curriculum, pricing, and delivery.">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_320px]">
        <div className="space-y-6">
          <Card className="space-y-8 bg-white p-8">
            <div className="space-y-4 border-b border-[var(--border)] pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Product editor</p>
              <h2 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">Edit the product once and let the page generate from it.</h2>
            </div>

            <form action={saveCourseAction} className="space-y-8">
              <input type="hidden" name="id" value={course.id} />

              <ProductFormSection title="Core identity" description="Title, route, owner, and status.">
                <label>
                  Title
                  <input name="title" defaultValue={course.title} required />
                </label>
                <label>
                  Slug
                  <input name="slug" defaultValue={course.slug} required />
                </label>
                <label>
                  Subtitle
                  <input name="subtitle" defaultValue={course.subtitle ?? ""} />
                </label>
                <label>
                  Instructor
                  <select name="instructorId" defaultValue={course.instructorId}>
                    {instructors.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select name="status" defaultValue={course.status}>
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </label>
                <div className="hidden md:block" />
              </ProductFormSection>

              <ProductFormSection title="Sales copy" description="Core page copy.">
                <label className="lg:col-span-2">
                  Short description
                  <textarea name="shortDescription" rows={4} defaultValue={course.shortDescription ?? ""} />
                </label>
                <label className="lg:col-span-2">
                  Long description
                  <textarea name="longDescription" rows={6} defaultValue={course.longDescription ?? ""} />
                </label>
                <label className="lg:col-span-2">
                  Outcomes
                  <textarea name="learningOutcomes" rows={4} defaultValue={(course.learningOutcomes as string[] | null)?.join("\n") ?? ""} />
                </label>
                <label>
                  Who it&apos;s for
                  <textarea name="whoItsFor" rows={4} defaultValue={(course.whoItsFor as string[] | null)?.join("\n") ?? ""} />
                </label>
                <label>
                  Includes
                  <textarea name="includes" rows={4} defaultValue={(course.includes as string[] | null)?.join("\n") ?? ""} />
                </label>
              </ProductFormSection>

              <ProductFormSection title="Media and SEO" description="Hero media and search.">
                <label>
                  Hero image URL
                  <input name="heroImageUrl" defaultValue={course.heroImageUrl ?? ""} />
                </label>
                <label>
                  Sales video URL
                  <input name="salesVideoUrl" defaultValue={course.salesVideoUrl ?? ""} />
                </label>
                <label>
                  SEO title
                  <input name="seoTitle" defaultValue={course.seoTitle ?? ""} />
                </label>
                <label className="lg:col-span-2">
                  SEO description
                  <textarea name="seoDescription" rows={3} defaultValue={course.seoDescription ?? ""} />
                </label>
              </ProductFormSection>

              <ProductFormSection title="Sales page" description="CTA copy and section visibility.">
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
                    rows={7}
                    defaultValue={(salesPageConfig.sectionOrder ?? ["description", "highlights", "curriculum", "instructor", "testimonials", "faqs", "pricing"]).join("\n")}
                  />
                </label>
                <label className="lg:col-span-2">
                  Hidden sections
                  <textarea
                    name="salesPage.hiddenSections"
                    rows={7}
                    defaultValue={(salesPageConfig.hiddenSections ?? []).join("\n")}
                  />
                </label>
              </ProductFormSection>

              <ProductFormSection title="Migration and preserved URLs" description="Only use these when preserving an old live route.">
                <label>
                  Legacy course ID
                  <input name="legacyCourseId" defaultValue={course.legacyCourseId ?? ""} />
                </label>
                <label>
                  Legacy slug
                  <input name="legacySlug" defaultValue={course.legacySlug ?? ""} />
                </label>
                <label className="md:col-span-2">
                  Legacy URL
                  <input name="legacyUrl" defaultValue={course.legacyUrl ?? ""} />
                </label>
              </ProductFormSection>

              <div className="border-t border-[var(--border)] pt-6">
                <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit">
                  Save course
                </button>
              </div>
            </form>
          </Card>

          <Card className="space-y-4 bg-white p-6">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Course CSV</p>
              <h2 className="text-2xl leading-none tracking-[-0.03em] text-stone-950">Download the migration CSV, fill it with Payhip details, then upload it here.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/api/imports/templates/course-package" className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">
                Download Course CSV
              </Link>
              <Link href="/api/imports/templates/course-students" className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-800">
                Download Course Students CSV
              </Link>
            </div>
            <p className="text-sm leading-7 text-stone-700">One row = one lesson. Repeat course-level fields on each row. Use the student CSV only for enrollments into this course.</p>
            <div className="grid gap-4 xl:grid-cols-2">
              <form action="/api/imports/course-package" method="post" encType="multipart/form-data" className="grid gap-3 rounded-[20px] border border-dashed border-stone-300 p-4">
                <label>
                  Upload completed course migration CSV
                  <input type="file" name="file" accept=".csv" required />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit" name="mode" value="dry-run">
                    Dry run
                  </button>
                  <button className="rounded-full border border-stone-300 px-4 py-3 text-sm font-medium text-stone-800" type="submit" name="mode" value="execute">
                    Execute import
                  </button>
                </div>
              </form>
              <form action="/api/imports/course-students" method="post" encType="multipart/form-data" className="grid gap-3 rounded-[20px] border border-dashed border-stone-300 p-4">
                <input type="hidden" name="courseId" value={course.id} />
                <label>
                  Upload completed student migration CSV
                  <input type="file" name="file" accept=".csv" required />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit" name="mode" value="dry-run">
                    Dry run
                  </button>
                  <button className="rounded-full border border-stone-300 px-4 py-3 text-sm font-medium text-stone-800" type="submit" name="mode" value="execute">
                    Import students
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Product status</p>
            <div className="grid gap-3 text-sm text-stone-700">
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Current status</span>
                <span className="mt-1 block text-base font-semibold text-stone-950">{course.status}</span>
              </div>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Public path</span>
                <span className="mt-1 block break-all text-base text-stone-950">{course.publicPath ?? `/course/${course.slug}`}</span>
              </div>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Generated pages</span>
                <span className="mt-1 block text-base text-stone-950">{course.pages.length}</span>
              </div>
              <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600">Curriculum</span>
                <span className="mt-1 block text-base text-stone-950">
                  {course.modules.length} module{course.modules.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </Card>

          <Card className="space-y-3 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Actions</p>
            <div className="grid gap-3">
              <button
                className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700"
                type="submit"
                formAction={regeneratePageAction}
                form="course-editor-actions"
                name="courseId"
                value={course.id}
              >
                Regenerate page
              </button>
              <Link href={course.publicPath ?? `/course/${course.slug}`} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">
                View public page
              </Link>
              {previewOffer ? (
                <Link href={`/checkout/${previewOffer.id}`} className="rounded-full border border-stone-200 px-5 py-3 text-center text-sm font-medium text-stone-700">
                  Preview checkout
                </Link>
              ) : null}
              <button
                className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700"
                type="submit"
                formAction={setCourseStatusAction}
                form="course-editor-actions"
                name="status"
                value="PUBLISHED"
              >
                Publish
              </button>
              <button
                className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700"
                type="submit"
                formAction={setCourseStatusAction}
                form="course-editor-actions"
                name="status"
                value="DRAFT"
              >
                Unpublish
              </button>
              <button
                className="rounded-full border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700"
                type="submit"
                formAction={deleteCourseAction}
                form="course-editor-actions"
                name="courseId"
                value={course.id}
              >
                Delete course
              </button>
            </div>
          </Card>
          <form id="course-editor-actions">
            <input type="hidden" name="id" value={course.id} />
          </form>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="space-y-4 bg-white">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-950">Curriculum</h2>
            <p className="text-sm text-stone-600">Build modules and lessons here.</p>
          </div>
          {course.modules.map((module) => (
            <details key={module.id} className="rounded-[24px] border border-stone-200 bg-stone-50 p-4" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Module {module.position}</p>
                  <p className="mt-1 text-lg font-semibold text-stone-950">{module.title}</p>
                </div>
                <p className="text-sm text-stone-600">{module.lessons.length} lesson{module.lessons.length === 1 ? "" : "s"}</p>
              </summary>
              <div className="mt-4 space-y-4">
                <form action={addModuleAction} className="grid gap-3 rounded-[20px] border border-stone-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_120px_auto]">
                  <input type="hidden" name="courseId" value={course.id} />
                  <input type="hidden" name="moduleId" value={module.id} />
                  <label>
                    Module title
                    <input name="title" defaultValue={module.title} />
                  </label>
                  <label>
                    Position
                    <input name="position" type="number" min="1" defaultValue={module.position} />
                  </label>
                  <div className="flex flex-wrap items-end gap-3">
                    <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit">
                      Save
                    </button>
                    <button
                      className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
                      type="submit"
                      formAction={deleteModuleAction}
                      name="moduleId"
                      value={module.id}
                    >
                      Delete
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {module.lessons.map((lesson) => (
                    <details key={lesson.id} className="rounded-[20px] border border-stone-200 bg-white p-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-stone-950">{lesson.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-stone-500">
                            {formatLessonType(lesson.type)} · {lesson.status}
                          </p>
                        </div>
                        <p className="text-sm text-stone-600">Open</p>
                      </summary>
                      <form action={addLessonAction} className="mt-4 grid gap-3">
                        <input type="hidden" name="courseId" value={course.id} />
                        <input type="hidden" name="moduleId" value={module.id} />
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <label>
                            Lesson title
                            <input name="title" defaultValue={lesson.title} />
                          </label>
                          <label>
                            Lesson slug
                            <input name="slug" defaultValue={lesson.slug} />
                          </label>
                          <label>
                            Position
                            <input name="position" type="number" min="1" defaultValue={lesson.position} />
                          </label>
                          <label>
                            Type
                            <select name="type" defaultValue={lesson.type}>
                              <option value="VIDEO">VIDEO</option>
                              <option value="TEXT">TEXT</option>
                              <option value="DOWNLOAD">DOWNLOAD</option>
                              <option value="MIXED">MIXED</option>
                            </select>
                          </label>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <label>
                            Text content
                            <textarea name="content" rows={3} defaultValue={lesson.content ?? ""} />
                          </label>
                          <label>
                            Video embed URL
                            <input name="videoUrl" defaultValue={lesson.videoUrl ?? ""} />
                          </label>
                        </div>
                        <details className="rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-3">
                          <summary className="cursor-pointer text-sm font-medium text-stone-700">Advanced lesson fields</summary>
                          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <label>
                              Download URL
                              <input name="downloadUrl" defaultValue={lesson.downloadUrl ?? ""} />
                            </label>
                            <label>
                              Duration
                              <input name="durationLabel" defaultValue={lesson.durationLabel ?? ""} />
                            </label>
                            <label>
                              Drip days
                              <input name="dripDays" type="number" min="0" defaultValue={lesson.dripDays ?? ""} />
                            </label>
                            <label>
                              Status
                              <select name="status" defaultValue={lesson.status}>
                                <option value="DRAFT">DRAFT</option>
                                <option value="PUBLISHED">PUBLISHED</option>
                              </select>
                            </label>
                          </div>
                          <label className="mt-3 flex items-center gap-3 text-stone-700">
                            <input className="w-auto" type="checkbox" name="isPreview" value="true" defaultChecked={lesson.isPreview} />
                            Preview lesson
                          </label>
                        </details>
                        <div className="flex flex-wrap gap-3">
                          <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit">
                            Save lesson
                          </button>
                          <button
                            className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
                            type="submit"
                            formAction={deleteLessonAction}
                            name="lessonId"
                            value={lesson.id}
                          >
                            Delete
                          </button>
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
                      <label>
                        Lesson title
                        <input name="title" />
                      </label>
                      <label>
                        Lesson slug
                        <input name="slug" />
                      </label>
                      <label>
                        Position
                        <input name="position" type="number" min="1" />
                      </label>
                      <label>
                        Type
                        <select name="type" defaultValue="VIDEO">
                          <option value="VIDEO">VIDEO</option>
                          <option value="TEXT">TEXT</option>
                          <option value="DOWNLOAD">DOWNLOAD</option>
                          <option value="MIXED">MIXED</option>
                        </select>
                      </label>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label>
                        Text content
                        <textarea name="content" rows={3} />
                      </label>
                      <label>
                        Video embed URL
                        <input name="videoUrl" />
                      </label>
                    </div>
                    <button className="w-fit rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit">
                      Add lesson
                    </button>
                  </form>
                </details>
              </div>
            </details>
          ))}
          <details className="rounded-[24px] border border-dashed border-stone-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-stone-950">Add module</summary>
            <form action={addModuleAction} className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_auto]">
              <input type="hidden" name="courseId" value={course.id} />
              <label>
                Module title
                <input name="title" />
              </label>
              <label>
                Position
                <input name="position" type="number" min="1" />
              </label>
              <button className="w-fit rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit">
                Add module
              </button>
            </form>
          </details>
        </Card>

        <Card className="space-y-6 bg-white">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-950">Pricing, FAQ, and reviews</h2>
            <p className="text-sm text-stone-600">Commerce details stay in the same product editor.</p>
          </div>
          <div className="space-y-3 text-sm text-stone-700">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Pricing</p>
            {course.offers.map((offer) => (
              <div key={offer.id} className="rounded-[20px] bg-stone-50 px-4 py-3">
                {offer.name} · {offer.price.toString()} {offer.currency}
              </div>
            ))}
            {course.faqs.map((faq) => (
              <div key={faq.id} className="rounded-[20px] bg-stone-50 px-4 py-3">
                FAQ: {faq.question}
              </div>
            ))}
            {course.testimonials.map((testimonial) => (
              <div key={testimonial.id} className="rounded-[20px] bg-stone-50 px-4 py-3">
                Testimonial: {testimonial.quote}
              </div>
            ))}
            <form action={saveOfferAction} className="grid gap-3 rounded-[20px] border border-dashed border-stone-200 p-4">
              <input type="hidden" name="courseId" value={course.id} />
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
            {course.offers.map((offer) => (
              <form key={`${offer.id}-edit`} action={saveOfferAction} className="grid gap-3 rounded-[20px] border border-stone-200 p-4">
                <input type="hidden" name="id" value={offer.id} />
                <input type="hidden" name="courseId" value={course.id} />
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
            <p className="pt-2 text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">FAQ</p>
            <form action={saveFaqAction} className="grid gap-3 rounded-[20px] border border-dashed border-stone-200 p-4">
              <input type="hidden" name="courseId" value={course.id} />
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
                <input name="position" type="number" min="1" defaultValue={course.faqs.length + 1} />
              </label>
              <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Add FAQ</button>
            </form>
            {course.faqs.map((faq) => (
              <form key={`${faq.id}-edit`} action={saveFaqAction} className="grid gap-3 rounded-[20px] border border-stone-200 p-4">
                <input type="hidden" name="faqId" value={faq.id} />
                <input type="hidden" name="courseId" value={course.id} />
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
            <p className="pt-2 text-sm font-semibold uppercase tracking-[0.24em] text-stone-500">Reviews</p>
            <form action={saveTestimonialAction} className="grid gap-3 rounded-[20px] border border-dashed border-stone-200 p-4">
              <input type="hidden" name="courseId" value={course.id} />
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
                <input name="position" type="number" min="1" defaultValue={course.testimonials.length + 1} />
              </label>
              <label className="flex items-center gap-2">
                <input className="w-auto" name="isApproved" type="checkbox" value="true" defaultChecked />
                Approved
              </label>
              <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50">Add testimonial</button>
            </form>
            {course.testimonials.map((testimonial) => (
              <form
                key={`${testimonial.id}-edit`}
                action={saveTestimonialAction}
                className="grid gap-3 rounded-[20px] border border-stone-200 p-4"
              >
                <input type="hidden" name="testimonialId" value={testimonial.id} />
                <input type="hidden" name="courseId" value={course.id} />
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
