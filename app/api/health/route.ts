import { prisma } from "@/lib/db/prisma";

export async function GET() {
  await prisma.$queryRaw`SELECT 1`;

  return Response.json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
}
