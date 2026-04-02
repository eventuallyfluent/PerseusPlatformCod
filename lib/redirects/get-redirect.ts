import { prisma } from "@/lib/db/prisma";

export async function getRedirect(fromPath: string) {
  return prisma.redirect.findUnique({
    where: { fromPath },
  });
}
