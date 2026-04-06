import { NextResponse } from "next/server";
import { executeImport } from "@/lib/imports/execute-import";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const mode = String(formData.get("mode") ?? "dry-run");
  const dryRun = mode !== "execute";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  const batch = await executeImport("COURSE_PACKAGE", file.name, await file.text(), dryRun);
  const executionSummary = batch.executionSummary as Record<string, unknown> | null;
  const targetCourseId = typeof executionSummary?.targetCourseId === "string" ? executionSummary.targetCourseId : null;

  if (!dryRun && targetCourseId) {
    return NextResponse.redirect(new URL(`/admin/courses/${targetCourseId}`, request.url));
  }

  if (!dryRun) {
    return NextResponse.redirect(new URL("/admin/courses", request.url));
  }

  return NextResponse.redirect(new URL(`/admin/imports/${batch.id}`, request.url));
}
