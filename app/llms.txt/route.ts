import { prisma } from "@/lib/db/prisma";
import { absoluteUrl } from "@/lib/utils";
import { LEGAL_COMPANY, LEGAL_PAGE_LINKS } from "@/lib/legal/company";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const [courses, bundles, instructors] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      select: {
        title: true,
        slug: true,
        publicPath: true,
        legacyUrl: true,
      },
    }),
    prisma.bundle.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      select: {
        title: true,
        slug: true,
        publicPath: true,
        legacyUrl: true,
      },
    }),
    prisma.instructor.findMany({
      where: {
        courses: {
          some: {
            status: "PUBLISHED",
          },
        },
      },
      orderBy: { name: "asc" },
      select: {
        name: true,
        slug: true,
      },
    }),
  ]);

  const lines = [
    `# ${SITE_NAME}`,
    "",
    `Legal entity: ${LEGAL_COMPANY.legalName}`,
    `Brand: ${LEGAL_COMPANY.dbaName}`,
    `Description: ${SITE_DESCRIPTION}`,
    "",
    "## Canonical public discovery hubs",
    `- Home: ${absoluteUrl("/")}`,
    `- Courses index: ${absoluteUrl("/courses")}`,
    `- Instructors index: ${absoluteUrl("/instructors")}`,
    `- FAQ: ${absoluteUrl("/faq")}`,
    "",
    "## Canonical public course sales pages",
    ...courses.map((course) => `- ${course.title}: ${absoluteUrl(course.publicPath ?? course.legacyUrl ?? `/course/${course.slug}`)}`),
    "",
    "## Canonical public bundle sales pages",
    ...bundles.map((bundle) => `- ${bundle.title}: ${absoluteUrl(bundle.publicPath ?? bundle.legacyUrl ?? `/bundle/${bundle.slug}`)}`),
    "",
    "## Instructor pages",
    ...instructors.map((instructor) => `- ${instructor.name}: ${absoluteUrl(`/instructors/${instructor.slug}`)}`),
    "",
    "## Public policy and contact pages",
    ...LEGAL_PAGE_LINKS.map((link) => `- ${link.label}: ${absoluteUrl(link.href)}`),
    "",
    "## Restrictions",
    "- Private learner lesson content is not public and should not be treated as crawlable public documentation.",
    "- Dashboard, checkout, purchased, preview, admin, and authentication routes are non-indexable private or transactional surfaces.",
    "- Preserved migrated public URLs are canonical for migrated items when they exist.",
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
