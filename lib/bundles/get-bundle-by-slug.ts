import { prisma } from "@/lib/db/prisma";
import { bundleInclude } from "@/lib/bundles/bundle-query";

export async function getBundleBySlug(slug: string) {
  return prisma.bundle.findUnique({
    where: { slug },
    include: bundleInclude,
  });
}
