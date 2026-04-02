import { prisma } from "@/lib/db/prisma";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const [courses, bundles, instructors] = await Promise.all([
    prisma.course.findMany({
      select: {
        publicPath: true,
        slug: true,
      },
    }),
    prisma.bundle.findMany({
      select: {
        publicPath: true,
        slug: true,
      },
    }),
    prisma.instructor.findMany({
      select: {
        slug: true,
      },
    }),
  ]);

  const urls = [
    absoluteUrl("/"),
    absoluteUrl("/faq"),
    ...courses.map((course) => absoluteUrl(course.publicPath ?? `/course/${course.slug}`)),
    ...bundles.map((bundle) => absoluteUrl(bundle.publicPath ?? `/bundle/${bundle.slug}`)),
    ...instructors.map((instructor) => absoluteUrl(`/instructors/${instructor.slug}`)),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `<url><loc>${url}</loc></url>`).join("")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
