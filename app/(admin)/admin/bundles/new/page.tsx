import { AdminShell } from "@/components/admin/admin-shell";
import { ImageField } from "@/components/admin/image-field";
import { Card } from "@/components/ui/card";
import { ProductFormSection, ProductFormShell } from "@/components/admin/product-form-shell";
import { saveBundleAction } from "@/app/(admin)/admin/actions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function NewBundlePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const uploadEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const allCourses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      subtitle: true,
    },
  });
  return (
    <AdminShell title="New bundle" description="A bundle sells multiple existing courses through one public page and checkout flow.">
      <ProductFormShell
        eyebrow="Bundle setup"
        title="Create one sales container for multiple courses."
        description="Create the bundle shell, choose the included courses, and set the live price in one first pass so the public page is meaningful immediately."
        submitLabel="Create bundle"
        action={saveBundleAction}
        aside={
          <>
            <Card className="space-y-4 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">What happens next</p>
              <ul className="space-y-2 text-sm leading-7 text-stone-600">
                <li>The bundle gets its own public path and generated sales page payload.</li>
                <li>You can choose the included courses now and refine them later on the bundle detail screen.</li>
                <li>Purchases unlock each linked course as a normal enrollment.</li>
              </ul>
            </Card>
            <Card className="space-y-4 p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-500">Bundle guidance</p>
              <ul className="space-y-2 text-sm leading-7 text-stone-600">
                <li>Keep the promise focused on convenience and coherent scope.</li>
                <li>Use `legacyUrl` only when preserving an existing migrated bundle path.</li>
                <li>Course selection, offer setup, and social proof happen after this first save.</li>
              </ul>
            </Card>
          </>
        }
      >
        {resolvedSearchParams?.error === "details" ? (
          <p className="rounded-[18px] bg-rose-50 px-4 py-3 text-sm text-rose-700">Bundle could not be created. Check the form fields and try again.</p>
        ) : null}
        <ProductFormSection
          title="Core identity"
          description="These fields define the bundle name, route, and publish state before the included course list is attached."
        >
          <label>
            Title
            <input name="title" required placeholder="Ritual Library Bundle" />
          </label>
          <label>
            Slug
            <input name="slug" required placeholder="ritual-library-bundle" />
          </label>
          <label>
            Subtitle
            <input name="subtitle" placeholder="A compact line for the hero section" />
          </label>
          <label>
            Status
            <select name="status" defaultValue="DRAFT">
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>
        </ProductFormSection>

        <ProductFormSection
          title="Sales copy"
          description="These structured fields feed the bundle landing page and explain why one purchase path is useful."
        >
          <label className="md:col-span-2">
            Short description
            <textarea name="shortDescription" rows={4} placeholder="A concise statement of the combined offer." />
          </label>
          <label className="md:col-span-2">
            Long description
            <textarea name="longDescription" rows={6} placeholder="Explain why these courses belong together and what one checkout unlocks." />
          </label>
          <label>
            Outcomes (one per line)
            <textarea name="learningOutcomes" rows={4} placeholder={"Build a core study library\nUnlock the full path in one purchase"} />
          </label>
          <label>
            Who it&apos;s for (one per line)
            <textarea name="whoItsFor" rows={4} placeholder={"Readers who want a starter library\nStudents who prefer one purchase"} />
          </label>
          <label>
            Includes (one per line)
            <textarea name="includes" rows={4} placeholder={"Included course access\nBundle pricing"} />
          </label>
          <div className="hidden md:block" />
        </ProductFormSection>

        <ProductFormSection
          title="Pricing"
          description="Set the real live bundle price now so the generated sales page and checkout are usable from first save."
        >
          <label>
            Price
            <input name="price" type="number" min="0" step="0.01" defaultValue="0" />
          </label>
          <label>
            Currency
            <input name="currency" defaultValue="USD" />
          </label>
          <label>
            Compare-at price
            <input name="compareAtPrice" type="number" min="0" step="0.01" />
          </label>
          <div className="hidden md:block" />
        </ProductFormSection>

        <ProductFormSection
          title="Included courses"
          description="Choose the courses this bundle unlocks. These are written on first save so the public bundle page can list every included course immediately."
        >
          <div className="md:col-span-2 grid gap-3">
            {allCourses.map((course) => (
              <label key={course.id} className="flex items-start gap-3 rounded-[20px] border border-stone-200 bg-white px-4 py-4 text-stone-700">
                <input className="mt-1 w-auto" type="checkbox" name="courseIds" value={course.id} />
                <span>
                  <span className="block font-semibold text-stone-950">{course.title}</span>
                  {course.subtitle ? <span className="block text-sm text-stone-700">{course.subtitle}</span> : null}
                </span>
              </label>
            ))}
          </div>
        </ProductFormSection>

        <ProductFormSection
          title="Media and SEO"
          description="Use media only if it strengthens the bundle promise. Search metadata can stay blank until final polish."
        >
          <ImageField
            name="heroImageUrl"
            label="Bundle cover image URL"
            previewLabel="Cover preview"
            uploadFolder="bundles"
            uploadEnabled={uploadEnabled}
          />
          <label>
            Sales video URL
            <input name="salesVideoUrl" placeholder="https://streamable.com/..." />
          </label>
          <label>
            SEO title
            <input name="seoTitle" placeholder="Optional search title override" />
          </label>
          <label className="md:col-span-2">
            SEO description
            <textarea name="seoDescription" rows={3} placeholder="Optional search description override." />
          </label>
        </ProductFormSection>

        <ProductFormSection
          title="Migration and URL preservation"
          description="Only set this when recreating an existing live path. The platform preserves exact public paths intentionally."
        >
          <label className="md:col-span-2">
            Legacy URL
            <input name="legacyUrl" placeholder="/bundle/archive-library" />
          </label>
        </ProductFormSection>
      </ProductFormShell>
    </AdminShell>
  );
}
