import { NextResponse } from "next/server";
import { createFailedImportBatch, createImportBatch, executeImportBatch } from "@/lib/imports/execute-import";

export const maxDuration = 60;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const mode = String(formData.get("mode") ?? "dry-run");
  const dryRun = mode !== "execute";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  const csvContent = await file.text();

  let batch;
  try {
    batch = await createImportBatch("COURSE_PACKAGE", file.name, csvContent, dryRun);
    if (!dryRun) {
      batch = await executeImportBatch(batch.id);
    }
  } catch (error) {
    const failedBatch = await createFailedImportBatch("COURSE_PACKAGE", file.name, csvContent, error);
    return NextResponse.redirect(new URL(`/admin/imports/${failedBatch.id}`, request.url), { status: 303 });
  }

  return NextResponse.redirect(new URL(`/admin/imports/${batch.id}`, request.url), { status: 303 });
}
