import { NextResponse } from "next/server";
import { markImportBatchFailed, startImportBatch } from "@/lib/imports/execute-import";

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  let batch;

  try {
    batch = await startImportBatch(batchId);
  } catch (error) {
    const failedBatch = await markImportBatchFailed(batchId, error);
    return NextResponse.redirect(new URL(`/admin/imports/${failedBatch.id}`, request.url));
  }

  return NextResponse.redirect(new URL(`/admin/imports/${batch.id}`, request.url));
}
