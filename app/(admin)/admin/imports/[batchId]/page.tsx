import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { ImportBatchRunner } from "@/components/admin/import-batch-runner";

export const dynamic = "force-dynamic";

function readNumber(source: Record<string, unknown> | null, key: string) {
  return Number(source?.[key] ?? 0);
}

function readBoolean(source: Record<string, unknown> | null, key: string) {
  return Boolean(source?.[key]);
}

function readString(source: Record<string, unknown> | null, key: string) {
  return String(source?.[key] ?? "");
}

function ChecklistItem({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">{label}</p>
      <p className={`mt-2 text-sm font-medium ${good === false ? "text-rose-700" : good === true ? "text-emerald-700" : "text-stone-950"}`}>{value}</p>
    </div>
  );
}

export default async function ImportBatchPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
  });

  if (!batch) {
    notFound();
  }

  const dryRunSummary = batch.dryRunSummary as Record<string, unknown> | null;
  const executionSummary = batch.executionSummary as Record<string, unknown> | null;
  const context = batch.context as Record<string, unknown> | null;
  const processedCount = Number(executionSummary?.processedCount ?? 0);
  const totalCount = Number(executionSummary?.totalCount ?? 0);
  const isProcessing = batch.status === "PROCESSING";
  const hasMore = readBoolean(executionSummary, "hasMore");
  const isStuck = isProcessing && hasMore && processedCount === 0;
  const targetCourse =
    String(executionSummary?.targetCourseTitle ?? dryRunSummary?.targetCourseTitle ?? "") ||
    String(executionSummary?.targetCourseSlug ?? dryRunSummary?.targetCourseSlug ?? "") ||
    String(context?.targetCourseId ?? "");
  const targetCourseId = readString(executionSummary, "targetCourseId") || readString(dryRunSummary, "targetCourseId") || readString(context, "targetCourseId");
  const targetCourseSlug = readString(executionSummary, "targetCourseSlug") || readString(dryRunSummary, "targetCourseSlug");
  const courseLookup = [
    targetCourseId ? { id: targetCourseId } : null,
    targetCourseSlug ? { slug: targetCourseSlug } : null,
  ].filter((item): item is { id: string } | { slug: string } => Boolean(item));
  const course = targetCourseId || targetCourseSlug
    ? await prisma.course.findFirst({
        where: {
          OR: courseLookup,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          publicPath: true,
          legacyUrl: true,
          heroImageUrl: true,
          testimonials: {
            where: { isApproved: true },
            select: { id: true },
          },
        },
      })
    : null;
  const publicPath = course?.publicPath ?? course?.legacyUrl ?? (course ? `/course/${course.slug}` : "");
  const dryRunHero = readBoolean(dryRunSummary, "hasHeroImage");
  const executionHero = readBoolean(executionSummary, "hasHeroImage");
  const heroDetected = executionHero || dryRunHero || Boolean(course?.heroImageUrl);
  const expectedTestimonials = readNumber(executionSummary, "testimonialCount") || readNumber(dryRunSummary, "testimonialCount");
  const importedTestimonials = readNumber(executionSummary, "importedTestimonialCount") || course?.testimonials.length || 0;
  const importedShortDescription = readString(executionSummary, "shortDescription") || readString(dryRunSummary, "shortDescription");
  const importedLongDescription = readString(executionSummary, "longDescription") || readString(dryRunSummary, "longDescription");

  return (
    <AdminShell title={`Import ${batch.filename}`} description="Dry-run and execution reports remain attached to the batch.">
      <Card className="space-y-4">
        <ImportBatchRunner batchId={batch.id} isProcessing={isProcessing} initialProcessedCount={processedCount} initialTotalCount={totalCount} />
        <div className="grid gap-3 text-sm text-stone-600">
          <div>Type: {batch.type}</div>
          <div>Status: {batch.status}</div>
          {isStuck ? <div className="font-medium text-amber-700">This batch is resumable and has not processed any rows yet.</div> : null}
          {isProcessing && !isStuck ? <div className="font-medium text-amber-700">If this batch stopped mid-run, use resume processing.</div> : null}
          {totalCount > 0 ? <div>Progress: {processedCount} / {totalCount}</div> : null}
          {targetCourse ? <div>Target course: {targetCourse}</div> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {batch.status === "DRY_RUN" ? (
            <form action={`/api/imports/batches/${batch.id}/execute`} method="post">
              <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit">
                Execute batch
              </button>
            </form>
          ) : null}
          {batch.status === "PROCESSING" ? (
            <form action={`/api/imports/batches/${batch.id}/execute`} method="post">
              <button className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-800" type="submit">
                Resume processing
              </button>
            </form>
          ) : null}
          {publicPath ? (
            <Link href={publicPath} className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700">
              View public page
            </Link>
          ) : null}
          {course ? (
            <Link href={`/admin/courses/${course.id}`} className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700">
              Edit course
            </Link>
          ) : null}
          <Link href="/admin/imports#student-import" className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700">
            Import students
          </Link>
          <a href={`/api/imports/batches/${batch.id}/errors`} className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700">
            Download error report
          </a>
        </div>
      </Card>

      <Card className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">Migration QA checklist</h2>
          <p className="mt-1 text-sm text-stone-600">Use this before treating the course as migrated.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ChecklistItem label="Target course" value={(course?.title ?? targetCourse) || "Not resolved yet"} good={Boolean(course || targetCourse)} />
          <ChecklistItem label="Rows" value={`${readNumber(dryRunSummary, "validCount")} valid / ${readNumber(dryRunSummary, "invalidCount")} invalid`} good={readNumber(dryRunSummary, "invalidCount") === 0} />
          <ChecklistItem label="Modules" value={String(readNumber(executionSummary, "moduleCount") || readNumber(dryRunSummary, "moduleCount") || 0)} good={(readNumber(executionSummary, "moduleCount") || readNumber(dryRunSummary, "moduleCount")) > 0} />
          <ChecklistItem label="Lessons" value={String(readNumber(executionSummary, "lessonCount") || readNumber(dryRunSummary, "lessonCount") || totalCount)} good={(readNumber(executionSummary, "lessonCount") || readNumber(dryRunSummary, "lessonCount") || totalCount) > 0} />
          <ChecklistItem label="Hero image" value={heroDetected ? "Detected" : "Missing"} good={heroDetected} />
          <ChecklistItem label="Reviews" value={`${importedTestimonials} imported / ${expectedTestimonials} detected`} good={expectedTestimonials === 0 ? undefined : importedTestimonials >= expectedTestimonials} />
          <ChecklistItem label="Execution progress" value={totalCount > 0 ? `${processedCount} / ${totalCount}` : "Not started"} good={batch.status === "COMPLETED"} />
          <ChecklistItem label="Status" value={isStuck ? "Resume needed" : batch.status.replaceAll("_", " ")} good={batch.status === "COMPLETED" ? true : batch.status === "FAILED" ? false : undefined} />
        </div>
        {readNumber(dryRunSummary, "conflictCount") > 0 ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Resolve {readNumber(dryRunSummary, "conflictCount")} conflict(s) before migration.</p>
        ) : null}
        {expectedTestimonials > 0 && importedTestimonials < expectedTestimonials && batch.status === "COMPLETED" ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">Reviews were detected in the CSV but not all were imported.</p>
        ) : null}
        {!heroDetected ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">No hero image was detected for this import. Add one before treating the sales page as Payhip-ready.</p>
        ) : null}
        {importedShortDescription || importedLongDescription ? (
          <div className="rounded-[20px] border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Imported page copy</p>
            {importedShortDescription ? <p className="mt-3 text-sm leading-6 text-stone-700">{importedShortDescription}</p> : null}
            {importedLongDescription ? <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-800">{importedLongDescription}</p> : null}
          </div>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">Dry run summary</h2>
          <pre className="mt-3 overflow-x-auto rounded-[20px] bg-stone-50 p-4 text-xs text-stone-600">{JSON.stringify(batch.dryRunSummary, null, 2)}</pre>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-950">Execution summary</h2>
          <pre className="mt-3 overflow-x-auto rounded-[20px] bg-stone-50 p-4 text-xs text-stone-600">{JSON.stringify(batch.executionSummary, null, 2)}</pre>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-stone-950">Error report</h2>
          <pre className="mt-3 overflow-x-auto rounded-[20px] bg-stone-50 p-4 text-xs text-stone-600">{JSON.stringify(batch.errorReport, null, 2)}</pre>
        </div>
      </Card>
    </AdminShell>
  );
}
