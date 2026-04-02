import { prisma } from "@/lib/db/prisma";
import { bundleInclude } from "@/lib/bundles/bundle-query";

export async function getBundleByPublicPath(path: string) {
  return prisma.bundle.findFirst({
    where: {
      OR: [{ publicPath: path }, { legacyUrl: path }],
    },
    include: bundleInclude,
  });
}
