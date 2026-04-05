import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { ProductFormSection } from "@/components/admin/product-form-shell";
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

  return (
    <AdminShell title={course.title} description="Basic info, curriculum, offers, SEO, and generated page controls.">
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.52fr]">
        <Card className="space-y-8 p-8">
          <div className="space-y-4 border-b border-[var(--border)] pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Course editor</p>
            <h2 className="text-4xl leading-none tracking-[-0.04em] text-stone-950">Keep the course record as the source of truth.</h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-600">
              Sales page copy, metadata, preserved paths, and learner-facing context all derive from these structured fields.
            </p>
          </div>

          <form action={saveCourseAction} className="space-y-8">
            <input type="hidden" name="id" value={course.id} />

            <ProductFormSection
              title="Core identity"
              description="Control the course name, owner, route slug, and publish state."
            >
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

            <ProductFormSection
              title="Sales copy"
              description="These fields feed the generated sales page sections directly."
            >
              <label className="md:col-span-2">
                Short description
                <textarea name="shortDescription" rows={4} defaultValue={course.shortDescription ?? ""} />
              </label>
              <label className="md:col-span-2">
                Long description
                <textarea name="longDescription" rows={6} defaultValue={course.longDescription ?? ""} />
              </label>
              <label>
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
              <div className="hidden md:block" />
            </ProductFormSection>

            <ProductFormSection
              title="Media and SEO"
              description="Media strengthens the hero and search metadata controls the external presentation."
            >
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
              <label className="md:col-span-2">
                SEO description
                <textarea name="seoDescription" rows={3} defaultValue={course.seoDescription ?? ""} />
              </label>
            </ProductFormSection>

            <ProductFormSection
              title="Migration and preserved URLs"
              description="Use these fields carefully. Exact paths are preserved intentionally and collisions fail validation."
            >
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

        <div className="space-y-4">
          <Card className="space-y-4 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Product status</p>
            <div className="grid gap-3 text-sm text-stone-600">
              <div className="rounded-[22px] border border-[var(--border)] bg-stone-50/80 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Current status</span>
                <span className="mt-1 block text-base font-semibold text-stone-950">{course.status}</span>
              </div>
              <div className="rounded-[22px] border border-[var(--border)] bg-stone-50/80 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Public path</span>
                <span className="mt-1 block break-all text-base text-stone-950">{course.publicPath ?? `/course/${course.slug}`}</span>
              </div>
              <div className="rounded-[22px] border border-[var(--border)] bg-stone-50/80 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Generated pages</span>
                <span className="mt-1 block text-base text-stone-950">{course.pages.length}</span>
              </div>
              <div className="rounded-[22px] border border-[var(--border)] bg-stone-50/80 px-4 py-3">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Curriculum</span>
                <span className="mt-1 block text-base text-stone-950">
                  {course.modules.length} module{course.modules.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </Card>

          <Card className="space-y-3 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Actions</p>
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
          <Card className="space-y-4 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">CSV import tools</p>
            <div className="space-y-3 text-sm leading-7 text-stone-600">
              <p>Use the course package CSV to refresh this course structure, then use the student CSV to grant access to this specific course.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/api/imports/templates/course-package" className="text-sm font-medium text-stone-950 underline">
                  Course package template
                </Link>
                <Link href="/api/imports/templates/course-students" className="text-sm font-medium text-stone-950 underline">
                  Student import template
                </Link>
              </div>
            </div>
            <form action="/api/imports/course-package" method="post" encType="multipart/form-data" className="grid gap-3 rounded-[20px] border border-dashed border-stone-200 p-4">
              <label>
                Course package CSV
                <input type="file" name="file" accept=".csv" required />
              </label>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit" name="mode" value="dry-run">
                  Dry run
                </button>
                <button className="rounded-full border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700" type="submit" name="mode" value="execute">
                  Execute import
                </button>
              </div>
            </form>
            <form action="/api/imports/course-students" method="post" encType="multipart/form-data" className="grid gap-3 rounded-[20px] border border-dashed border-stone-200 p-4">
              <input type="hidden" name="courseId" value={course.id} />
              <label>
                Student CSV
                <input type="file" name="file" accept=".csv" required />
              </label>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit" name="mode" value="dry-run">
                  Dry run
                </button>
                <button className="rounded-full border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700" type="submit" name="mode" value="execute">
                  Import students
                </button>
              </div>
            </form>
          </Card>
          <form id="course-editor-actions">
            <input type="hidden" name="id" value={course.id} />
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-950">Curriculum</h2>
          {course.modules.map((module) => (
            <div key={module.id} className="space-y-3 rounded-[24px] bg-stone-50 p-4">
              <form action={addModuleAction} className="grid gap-3 rounded-[20px] border border-stone-200 bg-white p-4">
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
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit">
                    Save module
                  </button>
                  <button
                    className="rounded-full border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700"
                    type="submit"
                    formAction={deleteModuleAction}
                    name="moduleId"
                    value={module.id}
                  >
                    Delete module
                  </button>
                </div>
              </form>
              <ul className="space-y-3 text-sm text-stone-600">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id} className="rounded-[20px] border border-stone-200 bg-white p-4">
                    <form action={addLessonAction} className="grid gap-3">
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="moduleId" value={module.id} />
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <label>
                        Lesson title
                        <input name="title" defaultValue={lesson.title} />
                      </label>
                      <label>
                        Lesson slug
                        <input name="slug" defaultValue={lesson.slug} />
                      </label>
                      <div className="grid gap-3 md:grid-cols-3">
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
                        <label>
                          Status
                          <select name="status" defaultValue={lesson.status}>
                            <option value="DRAFT">DRAFT</option>
                            <option value="PUBLISHED">PUBLISHED</option>
                          </select>
                        </label>
                      </div>
                      <label>
                        Content
                        <textarea name="content" rows={3} defaultValue={lesson.content ?? ""} />
                      </label>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label>
                          Video URL
                          <input name="videoUrl" defaultValue={lesson.videoUrl ?? ""} />
                        </label>
                        <label>
                          Download URL
                          <input name="downloadUrl" defaultValue={lesson.downloadUrl ?? ""} />
                        </label>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label>
                          Duration label
                          <input name="durationLabel" defaultValue={lesson.durationLabel ?? ""} />
                        </label>
                        <label>
                          Drip days
                          <input name="dripDays" type="number" min="0" defaultValue={lesson.dripDays ?? ""} />
                        </label>
                      </div>
                      <label className="flex items-center gap-3 text-stone-700">
                        <input className="w-auto" type="checkbox" name="isPreview" value="true" defaultChecked={lesson.isPreview} />
                        Preview lesson
                      </label>
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
                          Delete lesson
                        </button>
                      </div>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={addLessonAction} className="grid gap-3">
                <input type="hidden" name="courseId" value={course.id} />
                <input type="hidden" name="moduleId" value={module.id} />
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
                <label>
                  Status
                  <select name="status" defaultValue="DRAFT">
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                </label>
                <label>
                  Content
                  <textarea name="content" rows={3} />
                </label>
                <label>
                  Video URL
                  <input name="videoUrl" />
                </label>
                <label>
                  Download URL
                  <input name="downloadUrl" />
                </label>
                <label>
                  Duration label
                  <input name="durationLabel" />
                </label>
                <label>
                  Drip days
                  <input name="dripDays" type="number" min="0" />
                </label>
                <label className="flex items-center gap-3 text-stone-700">
                  <input className="w-auto" type="checkbox" name="isPreview" value="true" />
                  Preview lesson
                </label>
                <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit">
                  Add lesson
                </button>
              </form>
            </div>
          ))}
          <form action={addModuleAction} className="grid gap-3 rounded-[24px] border border-dashed border-stone-200 p-4">
            <input type="hidden" name="courseId" value={course.id} />
            <label>
              Module title
              <input name="title" />
            </label>
            <label>
              Position
              <input name="position" type="number" min="1" />
            </label>
            <button className="rounded-full bg-stone-950 px-4 py-3 text-sm font-medium text-stone-50" type="submit">
              Add module
            </button>
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-950">Offers and social proof</h2>
          <div className="space-y-3 text-sm text-stone-600">
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
