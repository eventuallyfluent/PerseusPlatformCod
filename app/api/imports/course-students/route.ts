import { NextResponse } from "next/server";
import { createFailedImportBatch, createImportBatch } from "@/lib/imports/execute-import";

export const maxDuration = 60;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const courseId = String(formData.get("courseId") ?? "");
  const mode = String(formData.get("mode") ?? "dry-run");
  const dryRun = mode !== "execute";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  if (!courseId) {
    return NextResponse.json({ error: "Course is required" }, { status: 400 });
  }

  const csvContent = await file.text();
  let batch;

  try {
    batch = await createImportBatch("COURSE_STUDENTS", file.name, csvContent, dryRun, {
      targetCourseId: courseId,
    });
  } catch (error) {
    const failedBatch = await createFailedImportBatch("COURSE_STUDENTS", file.name, csvContent, error, {
      targetCourseId: courseId,
    });
    return NextResponse.redirect(new URL(`/admin/imports/${failedBatch.id}`, request.url));
  }

  return NextResponse.redirect(new URL(`/admin/imports/${batch.id}`, request.url));
}
