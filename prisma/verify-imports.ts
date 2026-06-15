import { readFile } from "node:fs/promises";
import { CourseStatus, LessonType, Prisma, PrismaClient } from "@prisma/client";
import { dryRunImport } from "../lib/imports/dry-run-import";
import { createImportBatch, executeImport, executeImportBatch } from "../lib/imports/execute-import";
import { courseInclude } from "../lib/courses/course-query";
import { generateSalesPagePayload } from "../lib/sales-pages/generate-sales-page-payload";

const prisma = new PrismaClient();

async function main() {
  const packageCsv = await readFile("samples/imports/perseus-course-package.csv", "utf8");
  const studentCsv = await readFile("samples/imports/perseus-course-students.csv", "utf8");
  const expectedLongDescription =
    "A practical starter course that combines symbolic orientation ritual structure and steady personal practice into one guided path.";

  await prisma.testimonial.deleteMany({
    where: {
      email: "dynamic.review.count@example.com",
    },
  });

  const packageDryRun = await dryRunImport("COURSE_PACKAGE", packageCsv);
  if (packageDryRun.invalidRows.length > 0 || packageDryRun.conflicts.length > 0 || packageDryRun.validRows.length === 0) {
    throw new Error("Course package dry run failed");
  }

  const audioLessonTypeCsv = packageCsv.replace(",VIDEO,", ",audio,");
  const audioLessonTypeDryRun = await dryRunImport("COURSE_PACKAGE", audioLessonTypeCsv);
  if (audioLessonTypeDryRun.invalidRows.length > 0 || audioLessonTypeDryRun.validRows[0]?.row.lesson_type !== LessonType.MIXED) {
    throw new Error("Course package dry run did not tolerate Payhip audio lesson types.");
  }

  const externalLinkLessonTypeCsv = packageCsv.replace(",VIDEO,", ",external_link,");
  const externalLinkLessonTypeDryRun = await dryRunImport("COURSE_PACKAGE", externalLinkLessonTypeCsv);
  if (externalLinkLessonTypeDryRun.invalidRows.length > 0 || externalLinkLessonTypeDryRun.validRows[0]?.row.lesson_type !== LessonType.MIXED) {
    throw new Error("Course package dry run did not tolerate Payhip external link lesson types.");
  }

  const requirementsLessonTypeCsv = packageCsv.replace(",VIDEO,", ",requirements,");
  const requirementsLessonTypeDryRun = await dryRunImport("COURSE_PACKAGE", requirementsLessonTypeCsv);
  if (requirementsLessonTypeDryRun.invalidRows.length > 0 || requirementsLessonTypeDryRun.validRows[0]?.row.lesson_type !== LessonType.MIXED) {
    throw new Error("Course package dry run did not tolerate Payhip requirements lesson types.");
  }

  const teaserLessonTypeCsv = packageCsv.replace(",VIDEO,", ",teaser,");
  const teaserLessonTypeDryRun = await dryRunImport("COURSE_PACKAGE", teaserLessonTypeCsv);
  if (teaserLessonTypeDryRun.invalidRows.length > 0 || teaserLessonTypeDryRun.validRows[0]?.row.lesson_type !== LessonType.MIXED) {
    throw new Error("Course package dry run did not tolerate Payhip teaser lesson types.");
  }

  const resourceLessonTypeCsv = packageCsv.replace(",VIDEO,", ",resource,");
  const resourceLessonTypeDryRun = await dryRunImport("COURSE_PACKAGE", resourceLessonTypeCsv);
  if (resourceLessonTypeDryRun.invalidRows.length > 0 || resourceLessonTypeDryRun.validRows[0]?.row.lesson_type !== LessonType.MIXED) {
    throw new Error("Course package dry run did not tolerate Payhip resource lesson types.");
  }

  const directExecuteCsv = packageCsv.replaceAll("ritual-discipline-foundations", "direct-execute-import-check");
  const directExecuteBatch = await createImportBatch("COURSE_PACKAGE", "direct-execute-import-check.csv", directExecuteCsv, false);
  const directExecuteResult = await executeImportBatch(directExecuteBatch.id);
  const directExecuteSummary = directExecuteResult.executionSummary as { processedCount?: number; totalCount?: number; hasMore?: boolean } | null;
  if (
    directExecuteResult.status !== "COMPLETED" ||
    directExecuteSummary?.processedCount !== directExecuteSummary?.totalCount ||
    directExecuteSummary?.hasMore
  ) {
    throw new Error("Direct course package execute did not complete server-side.");
  }

  const originalHeroImageUrl = "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80";
  const youtubeThumbnailUrl = "https://i.ytimg.com/vi/C8IkPvk7sg4/maxresdefault.jpg";
  const thumbnailHeroCsv = packageCsv
    .replaceAll("ritual-foundations-001", "thumbnail-hero-001")
    .replaceAll("ritual-discipline-foundations", "thumbnail-hero-import-check")
    .replace("hero_image_url,sales_video_url", "hero_image_url,product_image_url,sales_video_url")
    .replaceAll(`${originalHeroImageUrl},https://www.youtube.com/watch?v=dQw4w9WgXcQ`, `${youtubeThumbnailUrl},${originalHeroImageUrl},https://www.youtube.com/watch?v=dQw4w9WgXcQ`);
  const thumbnailHeroDryRun = await dryRunImport("COURSE_PACKAGE", thumbnailHeroCsv);

  if (
    thumbnailHeroDryRun.invalidRows.length > 0 ||
    thumbnailHeroDryRun.summary.heroImageUrl?.includes("ytimg.com") ||
    !thumbnailHeroDryRun.summary.heroImageUrl?.includes("images.unsplash.com")
  ) {
    throw new Error("Course package dry run must prefer the real course image over a YouTube thumbnail.");
  }

  await executeImport("COURSE_PACKAGE", "thumbnail-hero-import-check.csv", thumbnailHeroCsv, false);
  const thumbnailHeroCourse = await prisma.course.findUnique({
    where: { slug: "thumbnail-hero-import-check" },
    select: { heroImageUrl: true },
  });

  if (thumbnailHeroCourse?.heroImageUrl?.includes("ytimg.com") || !thumbnailHeroCourse?.heroImageUrl?.includes("images.unsplash.com")) {
    throw new Error("Course package execution must not persist a YouTube thumbnail as the course hero image.");
  }

  const blankStatusCsv = packageCsv
    .replaceAll("ritual-foundations-001", "blank-status-001")
    .replaceAll("ritual-discipline-foundations", "blank-status-import-check")
    .replaceAll("Structured ritual training for serious Perseus students.,PUBLISHED", "Structured ritual training for serious Perseus students.,");
  await executeImport("COURSE_PACKAGE", "blank-status-import-check.csv", blankStatusCsv, false);
  const blankStatusCourse = await prisma.course.findUnique({
    where: { slug: "blank-status-import-check" },
    select: {
      status: true,
      accessProduct: {
        select: { status: true },
      },
      pages: {
        where: { pageType: "sales" },
        select: { id: true },
      },
    },
  });

  if (
    blankStatusCourse?.status !== CourseStatus.PUBLISHED ||
    blankStatusCourse.accessProduct?.status !== CourseStatus.PUBLISHED ||
    blankStatusCourse.pages.length === 0
  ) {
    throw new Error("Course package imports with a blank status must publish the migrated sales page by default.");
  }

  const originalFetch = globalThis.fetch;
  const legacyMediaCsv = packageCsv
    .replaceAll("ritual-discipline-foundations", "legacy-media-import-check")
    .replaceAll("/course/legacy-media-import-check", "https://courses.perseusarcaneacademy.com/b/legacy-media-import-check")
    .replaceAll("https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80", "")
    .replaceAll("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/");

  globalThis.fetch = (async () =>
    new Response(
      '<html><body><a href="https://www.youtube.com/watch?v=C8IkPvk7sg4">Watch</a><img src="https://payhip.com/cdn-cgi/image/format=auto,width=600/https://pe56d.s3.amazonaws.com/o_legacy.jpg"><img src="https://pe56d.s3.amazonaws.com/o_gallery.jpg"></body></html>',
      { status: 200 },
    )) as typeof fetch;

  try {
    const legacyMediaDryRun = await dryRunImport("COURSE_PACKAGE", legacyMediaCsv);
    if (legacyMediaDryRun.invalidRows.length > 0) {
      throw new Error("Course package dry run rejected a valid legacy media import.");
    }

    if (legacyMediaDryRun.summary.heroImageUrl?.includes("payhip.com/cdn-cgi/image/")) {
      throw new Error("Course package dry run must not fetch missing media from the legacy sales page.");
    }

    const staleLegacyCourse = await prisma.course.findUnique({
      where: { slug: "legacy-media-import-check" },
      select: { id: true },
    });

    if (staleLegacyCourse) {
      await prisma.course.update({
        where: { id: staleLegacyCourse.id },
        data: { salesPageConfig: Prisma.JsonNull },
      });
    }

    await executeImport("COURSE_PACKAGE", "legacy-media-import-check.csv", legacyMediaCsv, false);

    const legacyMediaCourse = await prisma.course.findUnique({
      where: { slug: "legacy-media-import-check" },
      include: { pages: true },
    });
    const legacyGalleryUrls = ((legacyMediaCourse?.salesPageConfig as { galleryImageUrls?: string[] } | null)?.galleryImageUrls ?? []) as string[];
    const legacySalesPagePayload = legacyMediaCourse?.pages.find((page) => page.pageType === "sales")?.generatedPayload as {
      gallerySection?: { images?: string[] };
    } | null;

    if (
      !legacyMediaCourse?.heroImageUrl?.includes("payhip.com/cdn-cgi/image/") ||
      legacyMediaCourse.salesVideoUrl !== "https://www.youtube.com/watch?v=C8IkPvk7sg4" ||
      legacyGalleryUrls.length > 0 ||
      (legacySalesPagePayload?.gallerySection?.images?.length ?? 0) > 0
    ) {
      throw new Error("Legacy media recovery must save only the hero image and real YouTube URL, not scraped gallery images.");
    }

    let flakyFetchCount = 0;
    const flakyLegacyMediaCsv = legacyMediaCsv.replaceAll("legacy-media-import-check", "legacy-media-fallback-check");
    globalThis.fetch = (async () => {
      flakyFetchCount += 1;
      return new Response(
        flakyFetchCount === 1
          ? '<html><body><img src="https://payhip.com/cdn-cgi/image/format=auto,width=600/https://pe56d.s3.amazonaws.com/o_fallback.jpg"></body></html>'
          : "<html><body>No image this time</body></html>",
        { status: 200 },
      );
    }) as typeof fetch;

    const flakyBatch = await createImportBatch("COURSE_PACKAGE", "legacy-media-fallback-check.csv", flakyLegacyMediaCsv, false);
    const flakyResult = await executeImportBatch(flakyBatch.id);
    const flakySummary = flakyResult.executionSummary as { heroImageUrl?: string } | null;
    const flakyCourse = await prisma.course.findUnique({
      where: { slug: "legacy-media-fallback-check" },
      select: { heroImageUrl: true },
    });

    if (!flakySummary?.heroImageUrl?.includes("o_fallback.jpg") || !flakyCourse?.heroImageUrl?.includes("o_fallback.jpg")) {
      throw new Error("Course package execution did not persist the recovered legacy hero image.");
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  const payhipVerifiedBuyerPositionCsv = packageCsv.replace(",5,1,1,Orientation and practice,", ",5,Verified Buyer,1,Orientation and practice,");
  const payhipVerifiedBuyerPositionDryRun = await dryRunImport("COURSE_PACKAGE", payhipVerifiedBuyerPositionCsv);
  if (payhipVerifiedBuyerPositionDryRun.invalidRows.length > 0 || payhipVerifiedBuyerPositionDryRun.validRows[0]?.row.testimonial_position !== undefined) {
    throw new Error("Course package dry run did not tolerate Payhip testimonial_position metadata.");
  }

  const generatedCopyCsv = packageCsv.replace(
    expectedLongDescription,
    "The public page describes this as a huge course with guided practice.",
  );
  const generatedCopyDryRun = await dryRunImport("COURSE_PACKAGE", generatedCopyCsv);
  if (!generatedCopyDryRun.invalidRows.some((entry) => entry.errors.some((error) => error.includes("generated commentary")))) {
    throw new Error("Course package dry run did not reject generated source-page commentary in imported descriptions.");
  }

  await executeImport("COURSE_PACKAGE", "perseus-course-package.csv", packageCsv, false);

  const course = await prisma.course.findUnique({
    where: { slug: "ritual-discipline-foundations" },
    include: courseInclude,
  });

  if (!course) {
    throw new Error("Imported course not found");
  }

  if (course.longDescription !== expectedLongDescription) {
    throw new Error("Imported course long description was not preserved exactly from the CSV.");
  }

  const lessons = course.modules.flatMap((module) => module.lessons);
  if (course.modules.length !== 2 || lessons.length !== 3) {
    throw new Error("Imported curriculum shape is incorrect");
  }

  if (!course.salesVideoUrl?.includes("youtube.com")) {
    throw new Error("Imported sales video was not stored as expected");
  }

  if (!course.heroImageUrl?.includes("images.unsplash.com")) {
    throw new Error("Imported hero image was not stored as expected");
  }

  if (!lessons.some((lesson) => lesson.videoUrl?.includes("vimeo.com"))) {
    throw new Error("Imported Vimeo lesson video missing");
  }

  if (!lessons.some((lesson) => lesson.videoUrl?.includes("streamable.com"))) {
    throw new Error("Imported Streamable lesson video missing");
  }

  if (course.pages.length === 0) {
    throw new Error("Generated course page was not persisted");
  }

  const importedTestimonial = course.testimonials[0];
  if (
    !importedTestimonial ||
    importedTestimonial.name !== "Ari M." ||
    importedTestimonial.email !== "ari.student@example.com" ||
    importedTestimonial.rating !== 5 ||
    importedTestimonial.position !== 1 ||
    !importedTestimonial.isApproved ||
    !importedTestimonial.recommendsProduct
  ) {
    throw new Error("Imported testimonial was not stored with the expected approval, rating, recommendation, and position.");
  }

  const salesPage = course.pages.find((page) => page.pageType === "sales");
  const generatedPayload = salesPage?.generatedPayload as {
    hero?: { imageUrl?: string | null };
    descriptionSection?: { longDescription?: string | null };
    testimonialsSection?: { items?: Array<{ quote?: string; rating?: number; recommendsProduct?: boolean }> };
  } | null;

  if (!generatedPayload?.hero?.imageUrl?.includes("images.unsplash.com")) {
    throw new Error("Generated sales page payload is missing the imported hero image.");
  }

  if (generatedPayload.descriptionSection?.longDescription !== expectedLongDescription) {
    throw new Error("Generated sales page payload did not preserve the imported course description.");
  }

  if (!generatedPayload.testimonialsSection?.items?.some((item) => item.quote?.includes("clear and possible") && item.rating === 5 && item.recommendsProduct)) {
    throw new Error("Generated sales page payload is missing the imported testimonial.");
  }

  const requirementsPayload = generateSalesPagePayload({
    ...course,
    includes: ["REQUIREMENTS: The Three Releases and Establishment of Equilibrium Using the Elements."],
  });
  const requirementsCard = requirementsPayload.highlightsSection.cards.find((card) => card.id === "includes");
  if (
    requirementsCard?.title !== "Requirements" ||
    requirementsCard.items.some((item) => /^requirements?\s*[:：-]/i.test(item))
  ) {
    throw new Error("Requirement-only imported include data must render as requirements, not included benefits.");
  }

  const pendingReview = await prisma.testimonial.create({
    data: {
      courseId: course.id,
      email: "dynamic.review.count@example.com",
      name: "Dynamic Count Student",
      quote: "This pending review should not affect the public review count.",
      rating: 4,
      position: course.testimonials.length + 1,
      isApproved: false,
      recommendsProduct: true,
    },
  });
  const courseWithPendingReview = await prisma.course.findUniqueOrThrow({
    where: { id: course.id },
    include: courseInclude,
  });
  const pendingReviewPayload = generateSalesPagePayload(courseWithPendingReview);

  if (pendingReviewPayload.testimonialsSection.items.length !== 1) {
    throw new Error("Pending reviews must not affect the public dynamic review count.");
  }

  await prisma.testimonial.update({
    where: { id: pendingReview.id },
    data: { isApproved: true },
  });
  const courseWithApprovedReview = await prisma.course.findUniqueOrThrow({
    where: { id: course.id },
    include: courseInclude,
  });
  const approvedReviewPayload = generateSalesPagePayload(courseWithApprovedReview);

  if (approvedReviewPayload.testimonialsSection.items.length !== 2) {
    throw new Error("Approved reviews must increase the public dynamic review count.");
  }

  await prisma.testimonial.delete({
    where: { id: pendingReview.id },
  });

  const multiOfferCsv = [
    "legacy_course_id,slug,legacy_slug,legacy_url,title,subtitle,short_description,long_description,learning_outcomes,who_its_for,includes,hero_image_url,sales_video_url,sales_image_urls,instructor_slug,instructor_name,seo_title,seo_description,status,price,currency,compare_at_price,module_position,module_title,lesson_position,lesson_slug,lesson_title,lesson_type,lesson_content,video_url,download_url,is_preview,drip_days,duration_label,lesson_status",
    "multi-offer-001,multi-offer-import-check,multi-offer-import-check,/course/multi-offer-import-check,Multi Offer Import Check,Monthly and annual checkout paths.,A course used to verify multiple buying options.,A direct source description preserved from the import CSV.,Outcome one,Focused students,Video lessons,https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80,https://www.youtube.com/watch?v=dQw4w9WgXcQ,https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80|https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80,peter-example,Peter Example,Multi Offer Import Check,Multiple checkout paths.,PUBLISHED,49 monthly / 360 annual,USD,,1,Start here,1,welcome,Welcome,VIDEO,Welcome lesson,https://vimeo.com/76979871,,true,0,5 min,PUBLISHED",
  ].join("\n");
  const multiOfferDryRun = await dryRunImport("COURSE_PACKAGE", multiOfferCsv);

  if (multiOfferDryRun.summary.offerOptionCount !== 2) {
    throw new Error("Course package dry run did not detect the two imported buying options.");
  }

  await executeImport("COURSE_PACKAGE", "multi-offer-import-check.csv", multiOfferCsv, false);

  const multiOfferCourse = await prisma.course.findUnique({
    where: { slug: "multi-offer-import-check" },
    include: {
      offers: {
        include: {
          prices: true,
        },
        orderBy: [{ isDefault: "desc" }, { price: "asc" }],
      },
      pages: true,
    },
  });

  const monthlyOffer = multiOfferCourse?.offers.find((offer) => offer.type === "SUBSCRIPTION" && offer.prices.some((price) => price.billingInterval === "month"));
  const annualOffer = multiOfferCourse?.offers.find((offer) => offer.type === "ONE_TIME" && Number(offer.price) === 360);

  if (!multiOfferCourse || !monthlyOffer || !annualOffer) {
    throw new Error("Imported course did not save both monthly and one-off/annual buying options.");
  }

  const multiOfferPayload = multiOfferCourse.pages.find((page) => page.pageType === "sales")?.generatedPayload as {
    offers?: Array<{ name?: string; price?: string; checkoutUrl?: string }>;
    pricingSection?: { offers?: Array<{ name?: string; price?: string; checkoutUrl?: string }> };
    gallerySection?: { images?: string[]; hidden?: boolean | null };
  } | null;

  if ((multiOfferPayload?.offers?.length ?? 0) < 2 || (multiOfferPayload?.pricingSection?.offers?.length ?? 0) < 2) {
    throw new Error("Generated sales page payload does not expose all imported buying options.");
  }

  if ((multiOfferPayload?.gallerySection?.images?.length ?? 0) !== 2 || multiOfferPayload?.gallerySection?.hidden) {
    throw new Error("Generated sales page payload does not expose imported sales gallery images.");
  }

  const studentDryRun = await dryRunImport("COURSE_STUDENTS", studentCsv, {
    targetCourseId: course.id,
  });
  if (studentDryRun.invalidRows.length > 0 || studentDryRun.conflicts.length > 0 || studentDryRun.validRows.length !== 2) {
    throw new Error("Course student dry run failed");
  }

  await executeImport("COURSE_STUDENTS", "perseus-course-students.csv", studentCsv, false, {
    targetCourseId: course.id,
  });

  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId: course.id,
      user: {
        email: {
          in: ["ritual.student.one@example.com", "ritual.student.two@example.com"],
        },
      },
    },
    include: {
      user: true,
    },
  });

  if (enrollments.length !== 2) {
    throw new Error("Imported students were not enrolled into the course");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        course: course.slug,
        modules: course.modules.length,
        lessons: lessons.length,
        testimonials: course.testimonials.length,
        offerOptions: multiOfferCourse.offers.length,
        heroImageUrl: course.heroImageUrl,
        enrolledStudents: enrollments.map((enrollment) => enrollment.user.email),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
