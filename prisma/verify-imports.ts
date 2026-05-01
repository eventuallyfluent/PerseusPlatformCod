import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import { dryRunImport } from "../lib/imports/dry-run-import";
import { executeImport } from "../lib/imports/execute-import";

const prisma = new PrismaClient();

async function main() {
  const packageCsv = await readFile("samples/imports/perseus-course-package.csv", "utf8");
  const studentCsv = await readFile("samples/imports/perseus-course-students.csv", "utf8");

  const packageDryRun = await dryRunImport("COURSE_PACKAGE", packageCsv);
  if (packageDryRun.invalidRows.length > 0 || packageDryRun.conflicts.length > 0 || packageDryRun.validRows.length === 0) {
    throw new Error("Course package dry run failed");
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
      pages: true,
    },
  });

  if (!course) {
    throw new Error("Imported course not found");
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
    testimonialsSection?: { items?: Array<{ quote?: string; rating?: number; recommendsProduct?: boolean }> };
  } | null;

  if (!generatedPayload?.hero?.imageUrl?.includes("images.unsplash.com")) {
    throw new Error("Generated sales page payload is missing the imported hero image.");
  }

  if (!generatedPayload.testimonialsSection?.items?.some((item) => item.quote?.includes("clear and possible") && item.rating === 5 && item.recommendsProduct)) {
    throw new Error("Generated sales page payload is missing the imported testimonial.");
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
