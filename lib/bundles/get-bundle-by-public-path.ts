import { prisma } from "@/lib/db/prisma";
import { bundleInclude } from "@/lib/bundles/bundle-query";
import { normalizePublicPathInput } from "@/lib/urls/normalize-public-path";

export async function getBundleByPublicPath(path: string) {
  const normalizedPath = normalizePublicPathInput(path) ?? path;
  return prisma.bundle.findFirst({
    where: {
      OR: [
        { publicPath: path },
        { legacyUrl: path },
        { publicPath: normalizedPath },
        { legacyUrl: normalizedPath },
        { publicPath: { endsWith: normalizedPath } },
        { legacyUrl: { endsWith: normalizedPath } },
      ],
    },
    include: bundleInclude,
  });
}
