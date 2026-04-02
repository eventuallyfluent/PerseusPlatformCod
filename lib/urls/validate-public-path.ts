import { prisma } from "@/lib/db/prisma";

export async function validatePublicPathAvailability(path: string, courseId?: string, bundleId?: string) {
  const existingCourse = await prisma.course.findFirst({
    where: {
      publicPath: path,
      ...(courseId ? { NOT: { id: courseId } } : {}),
    },
    select: { id: true },
  });

  const existingBundle = await prisma.bundle.findFirst({
    where: {
      publicPath: path,
      ...(bundleId ? { NOT: { id: bundleId } } : {}),
    },
    select: { id: true },
  });

  const redirect = await prisma.redirect.findUnique({
    where: { fromPath: path },
    select: { id: true },
  });

  return !existingCourse && !existingBundle && !redirect;
}
