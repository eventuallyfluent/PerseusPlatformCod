import { prisma } from "@/lib/db/prisma";

export async function getActiveGateway() {
  return prisma.gateway.findFirst({
    where: { isActive: true },
    include: { credentials: true },
    orderBy: { updatedAt: "desc" },
  });
}
