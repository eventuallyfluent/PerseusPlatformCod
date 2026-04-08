import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { ImageField } from "@/components/admin/image-field";
import { Card } from "@/components/ui/card";
import { ProductFormSection, ProductFormShell } from "@/components/admin/product-form-shell";
import { saveCourseAction } from "@/app/(admin)/admin/actions";

export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const instructors = await prisma.instructor.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <AdminShell title="New course" description="Structured fields only. Sales pages generate from this content.">
      <ProductFormShell
        eyebrow="Course setup"
        title="Create the structured source of truth first."
        description="The course record drives the generated sales page, the learner surface, and the commerce layer. Enter the clean core details now; pricing, curriculum, FAQ, and testimonials can be expanded from the course detail screen after creation."
        submitLabel="Create course"
        action={saveCourseAction}
        aside={
          <>
            <Card className="space-y-4 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">What happens next</p>
              <ul className="space-y-2 text-sm leading-7 text-stone-600">
                <li>The platform reserves the course path from the slug or preserved legacy URL.</li>
                <li>A generated sales page payload is created from these structured fields.</li>
                <li>Modules, lessons, pricing, FAQ, and testimonials are added from the course detail screen.</li>
              </ul>
            </Card>
            <Card className="space-y-4 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Good defaults</p>
              <ul className="space-y-2 text-sm leading-7 text-stone-600">
                <li>Start in `DRAFT` unless the course already has real copy and pricing.</li>
                <li>Only use `legacyUrl` when preserving an exact migrated path.</li>
                <li>Keep list fields concise. The generated page reads these directly.</li>
              </ul>
            </Card>
            <Card className="space-y-4 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Import one full course</p>
              <p className="text-sm leading-7 text-stone-600">
                Download the Perseus migration template, fill it with your current Payhip course details, then upload it here to create the course in one pass.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <Link href="/api/imports/templates/course-package" className="font-medium text-stone-950 underline">
                Download course migration CSV
              </Link>
              </div>
              <p className="text-xs leading-6 text-stone-500">
                One row = one lesson. Repeat the course-level fields on every row. Add testimonial columns, including rating, on any rows where you want imported Payhip reviews.
              </p>
              <form action="/api/imports/course-package" method="post" encType="multipart/form-data" className="grid gap-3">
                <label>
                  Upload completed course migration CSV
                  <input type="file" name="file" accept=".csv" required />
                </label>
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit" name="mode" value="dry-run">
                    Dry run
                  </button>
                  <button className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700" type="submit" name="mode" value="execute">
                    Execute import
                  </button>
                </div>
              </form>
            </Card>
          </>
        }
      >
        <ProductFormSection
          title="Core identity"
          description="These fields define the course name, path, instructor ownership, and initial publish state."
        >
          <label>
            Title
            <input name="title" required placeholder="Meta Magick Tarot" />
          </label>
          <label>
            Slug
            <input name="slug" required placeholder="meta-magick-tarot" />
          </label>
          <label>
            Subtitle
            <input name="subtitle" placeholder="A restrained subtitle for the sales page hero" />
          </label>
          <label>
            Instructor
            <select name="instructorId" required defaultValue="">
              <option value="" disabled>
                Select instructor
              </option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select name="status" defaultValue="DRAFT">
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
          <div className="hidden md:block" />
        </ProductFormSection>

        <ProductFormSection
          title="Sales copy"
          description="These are the structured fields the generated sales page uses for hero, description, outcomes, and audience sections."
        >
          <label className="md:col-span-2">
            Short description
            <textarea name="shortDescription" rows={4} placeholder="Clear, premium one-paragraph summary." />
          </label>
          <label className="md:col-span-2">
            Long description
            <textarea name="longDescription" rows={6} placeholder="More context for the core offer and transformation." />
          </label>
          <label>
            Outcomes (one per line)
            <textarea name="learningOutcomes" rows={4} placeholder={"Interpret symbolic systems clearly\nBuild a consistent practice"} />
          </label>
          <label>
            Who it&apos;s for (one per line)
            <textarea name="whoItsFor" rows={4} placeholder={"Committed beginners\nReaders seeking a guided path"} />
          </label>
          <label>
            Includes (one per line)
            <textarea name="includes" rows={4} placeholder={"Structured modules\nPreview lessons"} />
          </label>
          <div className="hidden md:block" />
        </ProductFormSection>

        <ProductFormSection
          title="Media and SEO"
          description="Add supporting media now if you have it. Canonical page metadata will derive from this record."
        >
          <ImageField
            name="heroImageUrl"
            label="Course cover image URL"
            previewLabel="Cover preview"
            uploadFolder="courses"
          />
          <label>
            Sales video URL
            <input name="salesVideoUrl" placeholder="https://streamable.com/..." />
          </label>
          <label>
            SEO title
            <input name="seoTitle" placeholder="Optional custom search title" />
          </label>
          <label className="md:col-span-2">
            SEO description
            <textarea name="seoDescription" rows={3} placeholder="Optional search description override." />
          </label>
        </ProductFormSection>

        <ProductFormSection
          title="Migration and URL preservation"
          description="Use these only when importing or recreating an existing Payhip path. Exact legacy paths are preserved intentionally."
        >
          <label>
            Legacy course ID
            <input name="legacyCourseId" placeholder="abc123" />
          </label>
          <label>
            Legacy slug
            <input name="legacySlug" placeholder="old-payhip-slug" />
          </label>
          <label className="md:col-span-2">
            Legacy URL
            <input name="legacyUrl" placeholder="/b/OWFpo" />
          </label>
        </ProductFormSection>
      </ProductFormShell>
    </AdminShell>
  );
}
