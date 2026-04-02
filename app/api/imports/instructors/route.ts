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

  const batch = await executeImport("INSTRUCTORS", file.name, await file.text(), dryRun);
  return NextResponse.redirect(new URL(`/admin/imports/${batch.id}`, request.url));
}
