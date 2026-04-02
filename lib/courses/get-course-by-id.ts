import { prisma } from "@/lib/db/prisma";
import { courseInclude } from "@/lib/courses/course-query";

export async function getCourseById(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: courseInclude,
  });
}
