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

  const generatedPage = await prisma.generatedPage.findFirst({
    where: {
      path: { in: [path, `${path}/purchased`] },
      ...(courseId || bundleId
        ? {
            NOT: {
              OR: [
                ...(courseId ? [{ courseId }] : []),
                ...(bundleId ? [{ bundleId }] : []),
              ],
            },
          }
        : {}),
    },
    select: { id: true },
  });

  return !existingCourse && !existingBundle && !redirect && !generatedPage;
}
