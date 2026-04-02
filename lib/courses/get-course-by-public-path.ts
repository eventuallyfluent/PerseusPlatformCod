import { prisma } from "@/lib/db/prisma";
import { courseInclude } from "@/lib/courses/course-query";

export async function getCourseByPublicPath(path: string) {
  return prisma.course.findFirst({
    where: {
      OR: [{ publicPath: path }, { legacyUrl: path }],
    },
    include: courseInclude,
  });
}
