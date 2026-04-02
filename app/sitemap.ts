import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, bundles, instructors] = await Promise.all([
    prisma.course.findMany({
      select: { publicPath: true, slug: true, updatedAt: true },
    }),
    prisma.bundle.findMany({
      select: { publicPath: true, slug: true, updatedAt: true },
    }),
    prisma.instructor.findMany({
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    { url: absoluteUrl("/"), lastModified: new Date() },
    { url: absoluteUrl("/faq"), lastModified: new Date() },
    ...courses.map((course) => ({
      url: absoluteUrl(course.publicPath ?? `/course/${course.slug}`),
      lastModified: course.updatedAt,
    })),
    ...bundles.map((bundle) => ({
      url: absoluteUrl(bundle.publicPath ?? `/bundle/${bundle.slug}`),
      lastModified: bundle.updatedAt,
    })),
    ...instructors.map((instructor) => ({
      url: absoluteUrl(`/instructors/${instructor.slug}`),
      lastModified: instructor.updatedAt,
    })),
  ];
}
