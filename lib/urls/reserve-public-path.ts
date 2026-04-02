import { prisma } from "@/lib/db/prisma";
import { validatePublicPathAvailability } from "@/lib/urls/validate-public-path";

export async function reservePublicPath(path: string, courseId: string) {
  const isAvailable = await validatePublicPathAvailability(path, courseId);

  if (!isAvailable) {
    throw new Error(`Public path collision detected for ${path}`);
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { publicPath: path },
  });
}
