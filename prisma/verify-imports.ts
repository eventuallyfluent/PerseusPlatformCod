import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { dryRunImport } from "../lib/imports/dry-run-import";
import { executeImport } from "../lib/imports/execute-import";

const prisma = new PrismaClient();

async function main() {
  const packageCsv = await readFile("samples/imports/perseus-course-package.csv", "utf8");
  const studentCsv = await readFile("samples/imports/perseus-course-students.csv", "utf8");
  const expectedLongDescription =
    "A practical starter course that combines symbolic orientation ritual structure and steady personal practice into one guided path.";

  const packageDryRun = await dryRunImport("COURSE_PACKAGE", packageCsv);
  if (packageDryRun.invalidRows.length > 0 || packageDryRun.conflicts.length > 0 || packageDryRun.validRows.length === 0) {
    throw new Error("Course package dry run failed");
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
    include: {
      modules: {
        include: {
          lessons: {
            orderBy: { position: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
      testimonials: {
        orderBy: { position: "asc" },
      },
      offers: {
        include: {
          prices: true,
        },
      },
      pages: true,
    },
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

  const multiOfferCsv = [
    "legacy_course_id,slug,legacy_slug,legacy_url,title,subtitle,short_description,long_description,learning_outcomes,who_its_for,includes,hero_image_url,sales_video_url,instructor_slug,instructor_name,seo_title,seo_description,status,price,currency,compare_at_price,module_position,module_title,lesson_position,lesson_slug,lesson_title,lesson_type,lesson_content,video_url,download_url,is_preview,drip_days,duration_label,lesson_status",
    "multi-offer-001,multi-offer-import-check,multi-offer-import-check,/course/multi-offer-import-check,Multi Offer Import Check,Monthly and annual checkout paths.,A course used to verify multiple buying options.,A direct source description preserved from the import CSV.,Outcome one,Focused students,Video lessons,https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80,https://www.youtube.com/watch?v=dQw4w9WgXcQ,peter-example,Peter Example,Multi Offer Import Check,Multiple checkout paths.,PUBLISHED,49 monthly / 360 annual,USD,,1,Start here,1,welcome,Welcome,VIDEO,Welcome lesson,https://vimeo.com/76979871,,true,0,5 min,PUBLISHED",
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
  } | null;

  if ((multiOfferPayload?.offers?.length ?? 0) < 2 || (multiOfferPayload?.pricingSection?.offers?.length ?? 0) < 2) {
    throw new Error("Generated sales page payload does not expose all imported buying options.");
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
