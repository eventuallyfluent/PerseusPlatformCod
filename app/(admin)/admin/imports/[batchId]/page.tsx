import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { ImportBatchRunner } from "@/components/admin/import-batch-runner";

export const dynamic = "force-dynamic";

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
  const targetCourse =
    String(executionSummary?.targetCourseTitle ?? dryRunSummary?.targetCourseTitle ?? "") ||
    String(executionSummary?.targetCourseSlug ?? dryRunSummary?.targetCourseSlug ?? "") ||
    String(context?.targetCourseId ?? "");

  return (
    <AdminShell title={`Import ${batch.filename}`} description="Dry-run and execution reports remain attached to the batch.">
      <Card className="space-y-4">
        <ImportBatchRunner batchId={batch.id} isProcessing={isProcessing} initialProcessedCount={processedCount} initialTotalCount={totalCount} />
        <div className="grid gap-3 text-sm text-stone-600">
          <div>Type: {batch.type}</div>
          <div>Status: {batch.status}</div>
          {isProcessing ? <div className="font-medium text-amber-700">If this batch stopped mid-run, use resume processing.</div> : null}
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
          <a href={`/api/imports/batches/${batch.id}/errors`} className="rounded-full border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700">
            Download error report
          </a>
        </div>
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
