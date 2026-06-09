import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { isStaleImportProcessing } from "@/lib/imports/import-batch-status";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { AdminActionBar, AdminDataTable, AdminStatusBadge, adminButtonClass, adminSecondaryButtonClass } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

function readCount(summary: unknown, key: string) {
  return summary && typeof summary === "object" && key in summary ? Number((summary as Record<string, unknown>)[key] ?? 0) : 0;
}

function isStuckProcessing(batch: { status: string; executionSummary: unknown; updatedAt: Date }) {
  if (batch.status !== "PROCESSING") {
    return false;
  }

  const hasMore = batch.executionSummary && typeof batch.executionSummary === "object"
    ? Boolean((batch.executionSummary as Record<string, unknown>).hasMore)
    : false;

  if (!hasMore) {
    return false;
  }

  return readCount(batch.executionSummary, "processedCount") === 0 || isStaleImportProcessing(batch.updatedAt);
}

function statusClassName(status: string, stuck: boolean) {
  if (stuck) return "warning";
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "danger";
  if (status === "PROCESSING") return "accent";
  return "neutral";
}

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

  return (
    <AdminShell title="Imports" description="Download the migration template, fill it with Payhip details, then upload it here.">
      <Card className="space-y-5 bg-white">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Migration workflow</p>
          <h2 className="text-xl font-semibold text-stone-950">Run migration as controlled QA, not blind bulk upload.</h2>
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
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/imports/readiness" className={adminButtonClass}>
            Check migration readiness
          </Link>
          <Link href="/admin/imports/images" className={adminSecondaryButtonClass}>
            Review imported images
          </Link>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5 bg-white">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-stone-700">Course CSV</p>
            <h2 className="text-3xl leading-none tracking-[-0.04em] text-stone-950">Migrate one Payhip course into Perseus.</h2>
            <p className="text-sm leading-7 text-stone-700">Use the course migration template for course info, modules, lessons, outcomes, image, trailer, reviews, and SEO.</p>
          </div>

          <div className="space-y-3">
            <Link href="/api/imports/templates/course-package" className={adminButtonClass}>
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
              <button className={adminButtonClass} type="submit" name="mode" value="dry-run">
                Dry run
              </button>
              <button className={adminSecondaryButtonClass} type="submit" name="mode" value="execute">
                Start import
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
            <Link href="/api/imports/templates/course-students" className={adminButtonClass}>
              Download Course Students CSV
            </Link>
            <p className="text-sm text-stone-700">Filename: <span className="font-medium text-stone-950">course-students-template.csv</span></p>
            <p className="text-sm leading-7 text-stone-700">Use one file per course. Email is required. Name and enrolled date are optional.</p>
          </div>

          <p className="rounded-[20px] bg-stone-50 px-4 py-3 text-xs leading-6 text-stone-700">email, name, enrolled_at</p>

          <form id="student-import" action="/api/imports/course-students" method="post" encType="multipart/form-data" className="grid gap-3">
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
              <button className={adminButtonClass} type="submit" name="mode" value="dry-run">
                Dry run
              </button>
              <button className={adminSecondaryButtonClass} type="submit" name="mode" value="execute">
                Import students
              </button>
            </div>
          </form>
        </Card>
      </div>

      <AdminDataTable
        columns={[{ header: "Type" }, { header: "Status" }, { header: "Filename" }, { header: "Images" }, { header: "Execution" }, { header: "Created" }, { header: "Actions" }]}
        rows={batches.map((batch) => {
          const stuck = isStuckProcessing(batch);
          const dryRunSummary = batch.dryRunSummary as Record<string, unknown> | null;
          const executionSummary = batch.executionSummary as Record<string, unknown> | null;
          const target = String(executionSummary?.targetCourseTitle ?? dryRunSummary?.targetCourseTitle ?? dryRunSummary?.targetCourseSlug ?? "");
          const processedCount = readCount(batch.executionSummary, "processedCount");
          const totalCount = readCount(batch.executionSummary, "totalCount");

          return {
            key: batch.id,
            cells: [
              <div key="type" className="space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">{batch.type.replaceAll("_", " ")}</p>
                {target ? <p className="text-xs text-[var(--text-secondary)]">{target}</p> : null}
              </div>,
              <AdminStatusBadge key="status" tone={statusClassName(batch.status, stuck)}>{stuck ? "Needs attention" : batch.status}</AdminStatusBadge>,
              batch.filename,
              executionSummary
                ? `${readCount(executionSummary, "imageCopiedCount")} copied / ${readCount(executionSummary, "imageFailedCount")} failed`
                : "-",
              stuck
                ? processedCount === 0
                  ? "No rows processed"
                  : `Stale at ${processedCount} / ${totalCount}`
                : batch.status === "PROCESSING"
                  ? `Processing ${processedCount} / ${totalCount}`
                  : batch.status === "COMPLETED" || batch.status === "FAILED"
                    ? "Recorded"
                    : "Pending",
              batch.createdAt.toLocaleString(),
              <AdminActionBar key="actions">
                <Link href={`/admin/imports/${batch.id}`} className={adminSecondaryButtonClass}>
                  {stuck ? "Resume" : "View"}
                </Link>
                <a href={`/api/imports/batches/${batch.id}/errors`} className={adminSecondaryButtonClass}>
                  Errors
                </a>
              </AdminActionBar>,
            ],
          };
        })}
        empty="No import batches yet."
      />
    </AdminShell>
  );
}
