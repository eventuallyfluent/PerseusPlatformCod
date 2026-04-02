import { prisma } from "@/lib/db/prisma";

export async function getInstructorBySlug(slug: string) {
  return prisma.instructor.findUnique({
    where: { slug },
    include: {
      courses: {
        where: { status: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}
