import { NextResponse } from "next/server";
import { ImportStatus } from "@prisma/client";
import { requireAdminRoute } from "@/lib/auth/admin-boundary";
import { prisma } from "@/lib/db/prisma";
import { markImportBatchFailed, startImportBatch } from "@/lib/imports/execute-import";

export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const unauthorized = await requireAdminRoute();
  if (unauthorized) return unauthorized;

  const { batchId } = await params;
  let batch;

  try {
    batch = await prisma.importBatch.findUnique({
      where: { id: batchId },
      select: { id: true, status: true },
    });

    if (!batch) {
      return NextResponse.json({ error: "Import batch not found" }, { status: 404 });
    }

    if (batch.status === ImportStatus.DRY_RUN) {
      batch = await startImportBatch(batchId);
    }
  } catch (error) {
    const failedBatch = await markImportBatchFailed(batchId, error);
    return NextResponse.redirect(new URL(`/admin/imports/${failedBatch.id}`, request.url), { status: 303 });
  }

  return NextResponse.redirect(new URL(`/admin/imports/${batch.id}`, request.url), { status: 303 });
}
