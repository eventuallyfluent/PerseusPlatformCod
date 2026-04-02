import { ImportStatus, ImportType } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { splitPipeList } from "@/lib/utils";
import { upsertInstructor } from "@/lib/instructors/upsert-instructor";
import { createCourse } from "@/lib/courses/create-course";
import { updateCourse } from "@/lib/courses/update-course";
import { upsertOffer } from "@/lib/offers/upsert-offer";
import { dryRunImport } from "@/lib/imports/dry-run-import";
import type { ImportExecutionSummary, ImportRowError } from "@/lib/imports/types";
import { courseCsvRowSchema, instructorCsvRowSchema, lessonCsvRowSchema, offerCsvRowSchema } from "@/lib/zod/schemas";

type InstructorCsvRow = z.infer<typeof instructorCsvRowSchema>;
type CourseCsvRow = z.infer<typeof courseCsvRowSchema>;
type LessonCsvRow = z.infer<typeof lessonCsvRowSchema>;
type OfferCsvRow = z.infer<typeof offerCsvRowSchema>;

async function executeInstructorRow(row: InstructorCsvRow) {
  const existing = await prisma.instructor.findUnique({
    where: { slug: row.slug },
    select: { id: true },
  });

  await upsertInstructor(
    {
      slug: row.slug,
      name: row.name,
      imageUrl: row.image_url,
      shortBio: row.short_bio,
      longBio: row.long_bio,
      websiteUrl: row.website_url,
      youtubeUrl: row.youtube_url,
      instagramUrl: row.instagram_url,
      xUrl: row.x_url,
      facebookUrl: row.facebook_url,
      discordUrl: row.discord_url,
      telegramUrl: row.telegram_url,
    },
    existing?.id,
  );

  return existing ? "updated" : "created";
}

async function executeCourseRow(row: CourseCsvRow) {
  const existing =
    (row.legacy_course_id
      ? await prisma.course.findFirst({
          where: {
            OR: [{ legacyCourseId: row.legacy_course_id }, { slug: row.slug }],
          },
          select: { id: true },
        })
      : await prisma.course.findUnique({
          where: { slug: row.slug },
          select: { id: true },
        })) ?? null;

  const instructor = await prisma.instructor.findUnique({
    where: { slug: row.instructor_slug },
    select: { id: true },
  });

  if (!instructor) {
    throw new Error(`Instructor ${row.instructor_slug} not found`);
  }

  const payload = {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    learningOutcomes: splitPipeList(row.learning_outcomes),
    whoItsFor: splitPipeList(row.who_its_for),
    includes: splitPipeList(row.includes),
    heroImageUrl: row.hero_image_url,
    salesVideoUrl: row.sales_video_url,
    instructorId: instructor.id,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    status: row.status,
    legacyCourseId: row.legacy_course_id,
    legacyUrl: row.legacy_url,
  };

  if (existing) {
    await updateCourse(existing.id, payload);
    return "updated";
  }

  await createCourse(payload);
  return "created";
}

async function executeLessonRow(row: LessonCsvRow) {
  const course = await prisma.course.findFirst({
    where: { legacyCourseId: row.legacy_course_id },
    include: {
      modules: {
        include: { lessons: true },
      },
    },
  });

  if (!course) {
    throw new Error(`Course ${row.legacy_course_id} not found`);
  }

  let courseModule = course.modules.find((item) => item.position === row.module_position);
  if (!courseModule) {
    courseModule = await prisma.module.create({
      data: {
        courseId: course.id,
        title: row.module_title,
        position: row.module_position,
      },
      include: { lessons: true },
    });
  }

  const existingLesson = courseModule.lessons.find((lesson) => lesson.position === row.lesson_position);

  if (existingLesson) {
    const unchanged =
      existingLesson.slug === row.lesson_slug &&
      existingLesson.title === row.lesson_title &&
      existingLesson.type === row.lesson_type &&
      existingLesson.status === row.status &&
      existingLesson.content === (row.lesson_content || null) &&
      existingLesson.videoUrl === (row.video_url || null) &&
      existingLesson.downloadUrl === (row.download_url || null) &&
      existingLesson.isPreview === row.is_preview &&
      existingLesson.dripDays === (row.drip_days ?? null) &&
      existingLesson.durationLabel === (row.duration_label || null);

    if (unchanged) {
      return "skipped";
    }

    await prisma.lesson.update({
      where: { id: existingLesson.id },
      data: {
        slug: row.lesson_slug,
        title: row.lesson_title,
        position: row.lesson_position,
        status: row.status,
        type: row.lesson_type,
        content: row.lesson_content,
        videoUrl: row.video_url || null,
        downloadUrl: row.download_url || null,
        isPreview: row.is_preview,
        dripDays: row.drip_days,
        durationLabel: row.duration_label,
      },
    });

    return "updated";
  }

  await prisma.lesson.create({
    data: {
      moduleId: courseModule.id,
      slug: row.lesson_slug,
      title: row.lesson_title,
      position: row.lesson_position,
      status: row.status,
      type: row.lesson_type,
      content: row.lesson_content,
      videoUrl: row.video_url || null,
      downloadUrl: row.download_url || null,
      isPreview: row.is_preview,
      dripDays: row.drip_days,
      durationLabel: row.duration_label,
    },
  });

  return "created";
}

async function executeOfferRow(row: OfferCsvRow) {
  const course = await prisma.course.findFirst({
    where: { legacyCourseId: row.legacy_course_id },
    select: { id: true },
  });

  if (!course) {
    throw new Error(`Course ${row.legacy_course_id} not found`);
  }

  const existing = await prisma.offer.findFirst({
    where: {
      courseId: course.id,
      name: row.offer_name,
    },
    select: {
      id: true,
      price: true,
      currency: true,
      type: true,
      isPublished: true,
    },
  });

  if (existing) {
    const unchanged =
      existing.price.toString() === String(row.price) &&
      existing.currency === row.currency.toUpperCase() &&
      existing.type === row.type &&
      existing.isPublished === true;

    if (unchanged) {
      return "skipped";
    }

    await upsertOffer(
      {
        courseId: course.id,
        name: row.offer_name,
        type: row.type,
        price: row.price,
        currency: row.currency,
        isPublished: true,
      },
      existing.id,
    );
    return "updated";
  }

  await upsertOffer({
    courseId: course.id,
    name: row.offer_name,
    type: row.type,
    price: row.price,
    currency: row.currency,
    isPublished: true,
  });
  return "created";
}

function buildExecutionSummary(type: ImportType): ImportExecutionSummary {
  return {
    type,
    createdCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    processedCount: 0,
  };
}

export async function createImportBatch(type: ImportType, filename: string, csvContent: string, dryRun = true) {
  const validation = await dryRunImport(type, csvContent);

  return prisma.importBatch.create({
    data: {
      type,
      filename,
      sourceContent: csvContent,
      status: dryRun ? ImportStatus.DRY_RUN : ImportStatus.DRAFT,
      dryRunSummary: validation.summary,
      errorReport: JSON.parse(JSON.stringify([...validation.invalidRows, ...validation.conflicts])),
      executionSummary: dryRun
        ? undefined
        : {
            type,
            createdCount: 0,
            updatedCount: 0,
            skippedCount: 0,
            failedCount: 0,
            processedCount: 0,
          },
    },
  });
}

export async function executeImportBatch(batchId: string) {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
  });

  if (!batch) {
    throw new Error("Import batch not found");
  }

  if (!batch.sourceContent) {
    throw new Error("Import batch source content is missing");
  }

  const validation = await dryRunImport(batch.type, batch.sourceContent);
  const summary = buildExecutionSummary(batch.type);
  const failures: ImportRowError[] = [...validation.invalidRows, ...validation.conflicts];

  for (const entry of validation.validRows) {
    try {
      let result: "created" | "updated" | "skipped";
      if (batch.type === ImportType.INSTRUCTORS) {
        result = await executeInstructorRow(entry.row as InstructorCsvRow);
      } else if (batch.type === ImportType.COURSES) {
        result = await executeCourseRow(entry.row as CourseCsvRow);
      } else if (batch.type === ImportType.LESSONS) {
        result = await executeLessonRow(entry.row as LessonCsvRow);
      } else {
        result = await executeOfferRow(entry.row as OfferCsvRow);
      }

      summary.processedCount += 1;
      if (result === "created") summary.createdCount += 1;
      if (result === "updated") summary.updatedCount += 1;
      if (result === "skipped") summary.skippedCount += 1;
    } catch (error) {
      summary.failedCount += 1;
      failures.push({
        rowNumber: entry.rowNumber,
        idempotencyKey: entry.idempotencyKey,
        row: entry.row,
        errors: [error instanceof Error ? error.message : "Unknown import execution error"],
      });
    }
  }

  return prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: failures.length > 0 && summary.processedCount === 0 ? ImportStatus.FAILED : ImportStatus.COMPLETED,
      dryRunSummary: validation.summary,
      executionSummary: summary,
      errorReport: JSON.parse(JSON.stringify(failures)),
    },
  });
}

export async function executeImport(type: ImportType, filename: string, csvContent: string, dryRun = true) {
  const batch = await createImportBatch(type, filename, csvContent, dryRun);

  if (dryRun) {
    return batch;
  }

  return executeImportBatch(batch.id);
}
