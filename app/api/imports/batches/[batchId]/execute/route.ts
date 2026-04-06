import { NextResponse } from "next/server";
import { executeImportBatch } from "@/lib/imports/execute-import";

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await executeImportBatch(batchId);
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
