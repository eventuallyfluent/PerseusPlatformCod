import { NextResponse } from "next/server";
import { executeImportBatch, markImportBatchFailed } from "@/lib/imports/execute-import";

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  let batch;

  try {
    batch = await executeImportBatch(batchId);
  } catch (error) {
    const failedBatch = await markImportBatchFailed(batchId, error);
    return NextResponse.redirect(new URL(`/admin/imports/${failedBatch.id}`, request.url));
  }

  const executionSummary = batch.executionSummary as Record<string, unknown> | null;
  const targetCourseId = typeof executionSummary?.targetCourseId === "string" ? executionSummary.targetCourseId : null;

  if (batch.type === "COURSE_PACKAGE" && targetCourseId) {
    return NextResponse.redirect(new URL(`/admin/courses/${targetCourseId}`, request.url));
  }

  if (batch.type === "COURSE_PACKAGE") {
    return NextResponse.redirect(new URL("/admin/courses", request.url));
  }

  return NextResponse.redirect(new URL(`/admin/imports/${batch.id}`, request.url));
}
