import { NextResponse } from "next/server";
import { executeImport } from "@/lib/imports/execute-import";

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

  const batch = await executeImport("COURSE_STUDENTS", file.name, await file.text(), dryRun, {
    targetCourseId: courseId,
  });
  return NextResponse.redirect(new URL(`/admin/imports/${batch.id}`, request.url));
}
