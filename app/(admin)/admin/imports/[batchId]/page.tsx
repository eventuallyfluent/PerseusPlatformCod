import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ImportBatchPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
  });

  if (!batch) {
    notFound();
  }

  return (
    <AdminShell title={`Import ${batch.filename}`} description="Dry-run and execution reports remain attached to the batch.">
      <Card className="space-y-4">
        <div className="grid gap-3 text-sm text-stone-600">
          <div>Type: {batch.type}</div>
          <div>Status: {batch.status}</div>
        </div>
        <div className="flex flex-wrap gap-3">
          {batch.status === "DRY_RUN" ? (
            <form action={`/api/imports/batches/${batch.id}/execute`} method="post">
              <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50" type="submit">
                Execute batch
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
