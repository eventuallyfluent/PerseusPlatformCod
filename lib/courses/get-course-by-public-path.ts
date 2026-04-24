import { prisma } from "@/lib/db/prisma";
import { courseInclude } from "@/lib/courses/course-query";
import { normalizePublicPathInput } from "@/lib/urls/normalize-public-path";

export async function getCourseByPublicPath(path: string) {
  const normalizedPath = normalizePublicPathInput(path) ?? path;
  return prisma.course.findFirst({
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
    include: courseInclude,
  });
}
