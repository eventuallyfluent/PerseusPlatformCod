import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/auth/admin-boundary";
import { markImportBatchFailed, processImportBatchChunk } from "@/lib/imports/execute-import";

export const maxDuration = 60;

const MAX_CHUNKS_PER_REQUEST = 8;

export async function POST(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const unauthorized = await requireAdminRoute();
  if (unauthorized) return unauthorized;

  const { batchId } = await params;

  try {
    let batch = await processImportBatchChunk(batchId);
    let executionSummary = batch.executionSummary as Record<string, unknown> | null;
    let processedChunks = 1;

    while (
      processedChunks < MAX_CHUNKS_PER_REQUEST &&
      batch.status === "PROCESSING" &&
      Boolean(executionSummary?.hasMore)
    ) {
      batch = await processImportBatchChunk(batchId);
      executionSummary = batch.executionSummary as Record<string, unknown> | null;
      processedChunks += 1;
    }

    return NextResponse.json({
      id: batch.id,
      status: batch.status,
      type: batch.type,
      executionSummary,
      hasMore: Boolean(executionSummary?.hasMore),
      processedChunks,
    });
  } catch (error) {
    const batch = await markImportBatchFailed(batchId, error);
    const executionSummary = batch.executionSummary as Record<string, unknown> | null;

    return NextResponse.json(
      {
        id: batch.id,
        status: batch.status,
        type: batch.type,
        executionSummary,
        hasMore: false,
        error: error instanceof Error ? error.message : "Unknown import processing error",
      },
      { status: 200 },
    );
  }
}
