import { prisma } from "@/lib/db/prisma";

export async function ensureEnrollment(userId: string, courseId: string) {
  return prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    update: {},
    create: {
      userId,
      courseId,
    },
  });
}
