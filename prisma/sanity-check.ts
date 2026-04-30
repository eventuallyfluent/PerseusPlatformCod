import { CourseStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [publishedCourses, activeGateway] = await Promise.all([
    prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      include: {
        offers: true,
        pages: true,
        accessProduct: true,
        modules: {
          include: { lessons: true },
        },
      },
      orderBy: { title: "asc" },
    }),
    prisma.gateway.findFirst({
      where: { isActive: true },
      select: {
        provider: true,
        displayName: true,
        kind: true,
        checkoutModel: true,
      },
    }),
  ]);

  if (publishedCourses.length === 0) {
    throw new Error("Catalog sanity check failed: no published courses were found.");
  }

  const brokenCourses = publishedCourses
    .map((course) => {
      const issues: string[] = [];
      const lessonCount = course.modules.reduce((count, module) => count + module.lessons.length, 0);

      if (!course.publicPath) issues.push("missing public path");
      if (course.offers.filter((offer) => offer.isPublished).length === 0) issues.push("missing published offer");
      if (!course.accessProduct) issues.push("missing access product");
      if (!course.pages.some((page) => page.pageType === "sales")) issues.push("missing generated sales page");
      if (!course.pages.some((page) => page.pageType === "thank-you")) issues.push("missing generated thank-you page");
      if (lessonCount === 0) issues.push("missing lessons");

      return issues.length > 0
        ? {
            slug: course.slug,
            title: course.title,
            issues,
          }
        : null;
    })
    .filter(Boolean);

  if (brokenCourses.length > 0) {
    throw new Error(`Catalog sanity check failed: ${JSON.stringify(brokenCourses, null, 2)}`);
  }

  if (!activeGateway) {
    throw new Error("Catalog sanity check failed: no active gateway is configured.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        publishedCourses: publishedCourses.length,
        activeGateway,
        checkedCourses: publishedCourses.map((course) => ({
          slug: course.slug,
          publicPath: course.publicPath,
          publishedOffers: course.offers.filter((offer) => offer.isPublished).length,
          generatedPages: course.pages.length,
          lessons: course.modules.reduce((count, module) => count + module.lessons.length, 0),
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
