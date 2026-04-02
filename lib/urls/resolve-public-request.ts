import { prisma } from "@/lib/db/prisma";
import { getBundleByPublicPath } from "@/lib/bundles/get-bundle-by-public-path";
import { getCourseByPublicPath } from "@/lib/courses/get-course-by-public-path";

export async function resolvePublicRequest(path: string) {
  const redirect = await prisma.redirect.findUnique({
    where: { fromPath: path },
  });

  if (redirect) {
    return {
      type: "redirect" as const,
      redirect,
    };
  }

  const course = await getCourseByPublicPath(path);

  if (course) {
    return {
      type: "course" as const,
      course,
    };
  }

  const bundle = await getBundleByPublicPath(path);

  if (bundle) {
    return {
      type: "bundle" as const,
      bundle,
    };
  }

  return null;
}
