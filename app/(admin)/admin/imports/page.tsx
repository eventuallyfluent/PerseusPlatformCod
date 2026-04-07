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
            <p className="text-sm leading-7 text-stone-700">One row = one lesson. Repeat course-level fields on every row. Include instructor slug/name, and add testimonial columns on any rows where you want imported Payhip reviews.</p>
          </div>

          <p className="rounded-[20px] bg-stone-50 px-4 py-3 text-xs leading-6 text-stone-700">
            legacy_course_id, slug, title, instructor_slug, instructor_name, testimonial_name, testimonial_quote, module_position, module_title, lesson_position, lesson_title...
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
                <td>{batch.executionSummary ? "Recorded" : "Pending"}</td>
                <td>{batch.createdAt.toLocaleString()}</td>
                <td>
                  <Link href={`/admin/imports/${batch.id}`} className="underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
