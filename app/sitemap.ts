import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { absoluteUrl } from "@/lib/utils";
import { LEGAL_PAGE_LINKS } from "@/lib/legal/company";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, bundles, instructors] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { publicPath: true, slug: true, legacyUrl: true, updatedAt: true, heroImageUrl: true },
    }),
    prisma.bundle.findMany({
      where: { status: "PUBLISHED" },
      select: { publicPath: true, slug: true, legacyUrl: true, updatedAt: true, heroImageUrl: true },
    }),
    prisma.instructor.findMany({
      where: {
        courses: {
          some: {
            status: "PUBLISHED",
          },
        },
      },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    { url: absoluteUrl("/"), lastModified: new Date() },
    { url: absoluteUrl("/courses"), lastModified: new Date() },
    { url: absoluteUrl("/instructors"), lastModified: new Date() },
    { url: absoluteUrl("/faq"), lastModified: new Date() },
    ...LEGAL_PAGE_LINKS.map((link) => ({
      url: absoluteUrl(link.href),
      lastModified: new Date(),
    })),
    ...courses.map((course) => ({
      url: absoluteUrl(course.publicPath ?? course.legacyUrl ?? `/course/${course.slug}`),
      lastModified: course.updatedAt,
      images: course.heroImageUrl ? [course.heroImageUrl] : undefined,
    })),
    ...bundles.map((bundle) => ({
      url: absoluteUrl(bundle.publicPath ?? bundle.legacyUrl ?? `/bundle/${bundle.slug}`),
      lastModified: bundle.updatedAt,
      images: bundle.heroImageUrl ? [bundle.heroImageUrl] : undefined,
    })),
    ...instructors.map((instructor) => ({
      url: absoluteUrl(`/instructors/${instructor.slug}`),
      lastModified: instructor.updatedAt,
    })),
  ];
}
