import { NextResponse } from "next/server";
import { processImportBatchChunk } from "@/lib/imports/execute-import";

export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await processImportBatchChunk(batchId);
  const executionSummary = batch.executionSummary as Record<string, unknown> | null;

  return NextResponse.json({
    id: batch.id,
    status: batch.status,
    type: batch.type,
    executionSummary,
    hasMore: Boolean(executionSummary?.hasMore),
  });
}
