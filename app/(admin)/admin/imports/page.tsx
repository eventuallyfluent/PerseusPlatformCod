import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

const templates = {
  instructors: "slug,name,image_url,short_bio,long_bio,website_url,youtube_url,instagram_url,x_url,facebook_url,discord_url,telegram_url",
  courses:
    "legacy_course_id,slug,legacy_url,title,subtitle,short_description,long_description,learning_outcomes,who_its_for,includes,hero_image_url,sales_video_url,instructor_slug,seo_title,seo_description,status",
  lessons:
    "legacy_course_id,module_position,module_title,lesson_position,lesson_slug,lesson_title,lesson_type,lesson_content,video_url,download_url,is_preview,drip_days,duration_label,status",
  offers: "legacy_course_id,offer_name,price,type,currency",
};

export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  const batches = await prisma.importBatch.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title="Migration center" description="Upload CSVs, run dry runs, execute imports, and inspect error reports.">
      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(templates).map(([type, template]) => (
          <Card key={type} className="space-y-4">
            <h2 className="text-lg font-semibold capitalize text-stone-950">{type}</h2>
            <p className="rounded-2xl bg-stone-50 px-4 py-3 text-xs leading-6 text-stone-600">{template}</p>
            <Link href={`/api/imports/templates/${type}`} className="text-sm font-medium text-stone-950 underline">
              Download template
            </Link>
            <form action={`/api/imports/${type}`} method="post" encType="multipart/form-data" className="grid gap-3">
              <label>
                CSV file
                <input type="file" name="file" accept=".csv" />
              </label>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit" name="mode" value="dry-run">
                  Dry run
                </button>
                <button className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700" type="submit" name="mode" value="execute">
                  Execute now
                </button>
              </div>
            </form>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden p-0">
        <table>
          <thead className="bg-stone-50 text-stone-500">
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
                <td>{batch.dryRunSummary ? "Ready" : "—"}</td>
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
