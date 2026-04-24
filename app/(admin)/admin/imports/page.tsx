import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  const [batches, courses] = await Promise.all([
    prisma.importBatch.findMany({
      where: {
        type: {
          in: ["COURSE_PACKAGE", "COURSE_STUDENTS"],
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
      },
    }),
  ]);

  void courses;

  return (
    <AdminShell title="Imports" description="Download the migration template, fill it with Payhip details, then upload it here.">
      <Card className="space-y-5 bg-white">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Migration workflow</p>
          <h2 className="text-3xl leading-none tracking-[-0.04em] text-stone-950">Run migration as controlled QA, not blind bulk upload.</h2>
          <p className="text-sm leading-7 text-stone-700">
            Preserve the existing Payhip-backed public path, dry run every course first, then verify the public page before importing students.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[22px] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-700">Per course</p>
            <ol className="mt-3 space-y-2 text-sm leading-7 text-stone-700">
              <li>1. Dry run the course package import.</li>
              <li>2. Resolve conflicts or warnings before execution.</li>
              <li>3. Execute the course import.</li>
              <li>4. Verify canonical public URL, page copy, curriculum, media, FAQ, reviews, product, and checkout.</li>
              <li>5. Dry run and import students only after the course itself is correct.</li>
            </ol>
          </div>
          <div className="rounded-[22px] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-700">Required QA</p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-stone-700">
              <li>Preserved canonical URL still matches the live migrated path.</li>
              <li>Sales page renders on the preserved route.</li>
              <li>SEO title and description imported correctly.</li>
              <li>Curriculum order, preview flags, and media URLs imported correctly.</li>
              <li>Product and offer link to checkout correctly.</li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-stone-700">Full rollout notes are in <span className="font-medium text-stone-950">MIGRATION_ROLLOUT.md</span> in the repo.</p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5 bg-white">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Course CSV</p>
            <h2 className="text-3xl leading-none tracking-[-0.04em] text-stone-950">Migrate one Payhip course into Perseus.</h2>
            <p className="text-sm leading-7 text-stone-700">Use the course migration template for course info, modules, lessons, outcomes, image, trailer, reviews, and SEO.</p>
          </div>

          <div className="space-y-3">
            <Link href="/api/imports/templates/course-package" className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">
              Download Course CSV
            </Link>
            <p className="text-sm text-stone-700">Filename: <span className="font-medium text-stone-950">course-package-template.csv</span></p>
            <p className="text-sm leading-7 text-stone-700">This template is intentionally row-per-lesson. Repeat course fields on every row. Only fill testimonial columns on rows where you are importing a review. Blank testimonial columns are valid.</p>
          </div>

          <p className="rounded-[20px] bg-stone-50 px-4 py-3 text-xs leading-6 text-stone-700">
            Course fields repeat on each lesson row so one CSV can create the full course structure in order.
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
              <button className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-800" type="submit" name="mode" value="execute">
                Execute import
              </button>
            </div>
          </form>
        </Card>

        <Card className="space-y-5 bg-white">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Course students CSV</p>
            <h2 className="text-3xl leading-none tracking-[-0.04em] text-stone-950">Migrate the students for one course.</h2>
            <p className="text-sm leading-7 text-stone-700">Use the student migration template to enroll existing Payhip students into the selected course.</p>
          </div>

          <div className="space-y-3">
            <Link href="/api/imports/templates/course-students" className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50">
              Download Course Students CSV
            </Link>
            <p className="text-sm text-stone-700">Filename: <span className="font-medium text-stone-950">course-students-template.csv</span></p>
            <p className="text-sm leading-7 text-stone-700">Use one file per course. Email is required. Name and enrolled date are optional.</p>
          </div>

          <p className="rounded-[20px] bg-stone-50 px-4 py-3 text-xs leading-6 text-stone-700">email, name, enrolled_at</p>

          <form action="/api/imports/course-students" method="post" encType="multipart/form-data" className="grid gap-3">
            <label>
              Course
              <select name="courseId" required defaultValue="">
                <option value="" disabled>
                  Select course
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Student CSV
              <input type="file" name="file" accept=".csv" required />
            </label>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit" name="mode" value="dry-run">
                Dry run
              </button>
              <button className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-800" type="submit" name="mode" value="execute">
                Import students
              </button>
            </div>
          </form>
        </Card>
      </div>

      <Card className="overflow-hidden bg-white p-0">
        <table>
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th>Type</th>
              <th>Status</th>
              <th>Filename</th>
              <th>Dry Run</th>
              <th>Execution</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id}>
                <td>{batch.type}</td>
                <td>{batch.status}</td>
                <td>{batch.filename}</td>
                <td>{batch.dryRunSummary ? "Ready" : "-"}</td>
                <td>
                  {batch.status === "PROCESSING"
                    ? "Processing"
                    : batch.status === "COMPLETED" || batch.status === "FAILED"
                      ? "Recorded"
                      : "Pending"}
                </td>
                <td>{batch.createdAt.toLocaleString()}</td>
                <td>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/admin/imports/${batch.id}`} className="underline">
                      View
                    </Link>
                    {batch.status === "PROCESSING" ? (
                      <Link href={`/admin/imports/${batch.id}`} className="text-sm font-medium text-stone-950 underline">
                        Resume
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
