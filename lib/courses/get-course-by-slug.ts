import { prisma } from "@/lib/db/prisma";
import { courseInclude } from "@/lib/courses/course-query";

export async function getCourseBySlug(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: courseInclude,
  });
}
