import { NextResponse } from "next/server";
import { executeImportBatch } from "@/lib/imports/execute-import";

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await executeImportBatch(batchId);
  return NextResponse.redirect(new URL(`/admin/imports/${batch.id}`, request.url));
}
