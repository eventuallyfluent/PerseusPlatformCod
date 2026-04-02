import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    select: {
      id: true,
      filename: true,
      errorReport: true,
    },
  });

  if (!batch) {
    notFound();
  }

  return new Response(JSON.stringify(batch.errorReport ?? [], null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${batch.filename}-errors.json"`,
    },
  });
}
