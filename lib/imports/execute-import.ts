import { ImportStatus, ImportType } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { splitPipeList } from "@/lib/utils";
import { upsertInstructor } from "@/lib/instructors/upsert-instructor";
import { createCourse } from "@/lib/courses/create-course";
import { updateCourse } from "@/lib/courses/update-course";
import { upsertOffer } from "@/lib/offers/upsert-offer";
import { dryRunImport, type ImportContext } from "@/lib/imports/dry-run-import";
import type { ImportExecutionSummary, ImportRowError } from "@/lib/imports/types";
import {
  courseCsvRowSchema,
  instructorCsvRowSchema,
  lessonCsvRowSchema,
  offerCsvRowSchema,
  coursePackageCsvRowSchema,
  courseStudentCsvRowSchema,
} from "@/lib/zod/schemas";
import { ensureEnrollment } from "@/lib/enrollments/ensure-enrollment";

type InstructorCsvRow = z.infer<typeof instructorCsvRowSchema>;
type CourseCsvRow = z.infer<typeof courseCsvRowSchema>;
type LessonCsvRow = z.infer<typeof lessonCsvRowSchema>;
type OfferCsvRow = z.infer<typeof offerCsvRowSchema>;
type CoursePackageCsvRow = z.infer<typeof coursePackageCsvRowSchema>;
type CourseStudentCsvRow = z.infer<typeof courseStudentCsvRowSchema>;

function humanizeSlug(slug: string) {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function ensureInstructorForImport(slug: string, name?: string | null) {
  const normalizedSlug = slug.trim();
  const normalizedName = String(name ?? "").trim() || humanizeSlug(normalizedSlug);

  if (!normalizedSlug || !normalizedName) {
    throw new Error("Instructor details are required");
  }

  const instructor = await prisma.instructor.upsert({
    where: { slug: normalizedSlug },
    update: normalizedName ? { name: normalizedName } : {},
    create: {
      slug: normalizedSlug,
      name: normalizedName,
    },
    select: { id: true },
  });

  return instructor;
}

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

  const instructor = await ensureInstructorForImport(row.instructor_slug, row.instructor_name);

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
    price: row.price,
    currency: row.currency,
    compareAtPrice: row.compare_at_price,
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

async function resolveExistingCourse(row: CoursePackageCsvRow) {
  return (
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
        })) ?? null
  );
}

async function executeCoursePackageRows(rows: CoursePackageCsvRow[]) {
  const summary = buildExecutionSummary(ImportType.COURSE_PACKAGE);

  if (rows.length === 0) {
    return summary;
  }

  const firstRow = rows[0];
  const instructor = await ensureInstructorForImport(firstRow.instructor_slug, firstRow.instructor_name);

  const payload = {
    slug: firstRow.slug,
    title: firstRow.title,
    subtitle: firstRow.subtitle,
    shortDescription: firstRow.short_description,
    longDescription: firstRow.long_description,
    learningOutcomes: splitPipeList(firstRow.learning_outcomes),
    whoItsFor: splitPipeList(firstRow.who_its_for),
    includes: splitPipeList(firstRow.includes),
    heroImageUrl: firstRow.hero_image_url,
    salesVideoUrl: firstRow.sales_video_url,
    instructorId: instructor.id,
    seoTitle: firstRow.seo_title,
    seoDescription: firstRow.seo_description,
    status: firstRow.status,
    price: firstRow.price,
    currency: firstRow.currency,
    compareAtPrice: firstRow.compare_at_price,
    legacyCourseId: firstRow.legacy_course_id,
    legacySlug: firstRow.legacy_slug,
    legacyUrl: firstRow.legacy_url,
  };

  const existingCourse = await resolveExistingCourse(firstRow);
  const course = existingCourse ? await updateCourse(existingCourse.id, payload) : await createCourse(payload);

  summary.targetCourseId = course.id;
  summary.targetCourseSlug = course.slug;
  summary.targetCourseTitle = course.title;
  summary.moduleCount = new Set(rows.map((row) => row.module_position)).size;
  summary.lessonCount = rows.length;
  if (existingCourse) {
    summary.updatedCount += 1;
  } else {
    summary.createdCount += 1;
  }

  for (const row of rows) {
    const existingModule = await prisma.module.findUnique({
      where: {
        courseId_position: {
          courseId: course.id,
          position: row.module_position,
        },
      },
      include: {
        lessons: true,
      },
    });

    let moduleId: string;

    if (!existingModule) {
      const createdModule = await prisma.module.create({
        data: {
          courseId: course.id,
          title: row.module_title,
          position: row.module_position,
        },
        include: { lessons: true },
      });
      moduleId = createdModule.id;
      summary.createdModuleCount = (summary.createdModuleCount ?? 0) + 1;
    } else {
      moduleId = existingModule.id;
      if (existingModule.title !== row.module_title) {
        await prisma.module.update({
          where: { id: existingModule.id },
          data: { title: row.module_title },
        });
        summary.updatedModuleCount = (summary.updatedModuleCount ?? 0) + 1;
      }
    }

    const existingLesson = await prisma.lesson.findUnique({
      where: {
        moduleId_position: {
          moduleId,
          position: row.lesson_position,
        },
      },
    });

    const lessonPayload = {
      slug: row.lesson_slug,
      title: row.lesson_title,
      position: row.lesson_position,
      status: row.lesson_status,
      type: row.lesson_type,
      content: row.lesson_content || null,
      videoUrl: row.video_url || null,
      downloadUrl: row.download_url || null,
      isPreview: row.is_preview,
      dripDays: row.drip_days,
      durationLabel: row.duration_label || null,
    };

    if (!existingLesson) {
      await prisma.lesson.create({
        data: {
          moduleId,
          ...lessonPayload,
        },
      });
      summary.createdLessonCount = (summary.createdLessonCount ?? 0) + 1;
      summary.createdCount += 1;
      summary.processedCount += 1;
      continue;
    }

    const unchanged =
      existingLesson.slug === lessonPayload.slug &&
      existingLesson.title === lessonPayload.title &&
      existingLesson.position === lessonPayload.position &&
      existingLesson.status === lessonPayload.status &&
      existingLesson.type === lessonPayload.type &&
      existingLesson.content === lessonPayload.content &&
      existingLesson.videoUrl === lessonPayload.videoUrl &&
      existingLesson.downloadUrl === lessonPayload.downloadUrl &&
      existingLesson.isPreview === lessonPayload.isPreview &&
      existingLesson.dripDays === (lessonPayload.dripDays ?? null) &&
      existingLesson.durationLabel === lessonPayload.durationLabel;

    if (unchanged) {
      summary.skippedCount += 1;
      summary.processedCount += 1;
      continue;
    }

    await prisma.lesson.update({
      where: { id: existingLesson.id },
      data: lessonPayload,
    });
    summary.updatedLessonCount = (summary.updatedLessonCount ?? 0) + 1;
    summary.updatedCount += 1;
    summary.processedCount += 1;
  }

  return summary;
}

async function executeCourseStudentRow(row: CourseStudentCsvRow, courseId: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email: row.email },
    select: { id: true },
  });

  const user =
    existingUser ??
    (await prisma.user.create({
      data: {
        email: row.email,
        name: row.name || null,
      },
      select: { id: true },
    }));

  if (row.name && existingUser) {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: row.name },
    });
  }

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId,
      },
    },
    select: { id: true },
  });

  if (existingEnrollment) {
    return "skipped";
  }

  await ensureEnrollment(user.id, courseId);

  if (row.enrolled_at) {
    const enrolledAt = new Date(row.enrolled_at);
    if (!Number.isNaN(enrolledAt.getTime())) {
      await prisma.enrollment.update({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId,
          },
        },
        data: { enrolledAt },
      });
    }
  }

  return existingUser ? "updated" : "created";
}

async function executeCourseStudentRows(rows: CourseStudentCsvRow[], context?: ImportContext) {
  if (!context?.targetCourseId) {
    throw new Error("Course student imports require a target course");
  }

  const course = await prisma.course.findUnique({
    where: { id: context.targetCourseId },
    select: { id: true, slug: true, title: true },
  });

  if (!course) {
    throw new Error("Target course not found");
  }

  const summary = buildExecutionSummary(ImportType.COURSE_STUDENTS);
  summary.targetCourseId = course.id;
  summary.targetCourseSlug = course.slug;
  summary.targetCourseTitle = course.title;

  for (const row of rows) {
    const result = await executeCourseStudentRow(row, course.id);
    summary.processedCount += 1;
    if (result === "created") summary.createdCount += 1;
    if (result === "updated") summary.updatedCount += 1;
    if (result === "skipped") summary.skippedCount += 1;
  }

  return summary;
}

export async function createImportBatch(type: ImportType, filename: string, csvContent: string, dryRun = true, context?: ImportContext) {
  const validation = await dryRunImport(type, csvContent, context);

  return prisma.importBatch.create({
    data: {
      type,
      filename,
      sourceContent: csvContent,
      context: context ? JSON.parse(JSON.stringify(context)) : undefined,
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

  const context = (batch.context as ImportContext | null) ?? undefined;
  const validation = await dryRunImport(batch.type, batch.sourceContent, context);
  const failures: ImportRowError[] = [...validation.invalidRows, ...validation.conflicts];

  if (batch.type === ImportType.COURSE_PACKAGE) {
    try {
      const summary = await executeCoursePackageRows(validation.validRows.map((entry) => entry.row as CoursePackageCsvRow));
      return prisma.importBatch.update({
        where: { id: batch.id },
        data: {
          status: failures.length > 0 && summary.processedCount === 0 ? ImportStatus.FAILED : ImportStatus.COMPLETED,
          dryRunSummary: validation.summary,
          executionSummary: summary,
          errorReport: JSON.parse(JSON.stringify(failures)),
        },
      });
    } catch (error) {
      failures.push({
        rowNumber: 1,
        idempotencyKey: "course-package",
        row: {},
        errors: [error instanceof Error ? error.message : "Unknown course package import error"],
      });
      return prisma.importBatch.update({
        where: { id: batch.id },
        data: {
          status: ImportStatus.FAILED,
          dryRunSummary: validation.summary,
          executionSummary: buildExecutionSummary(batch.type),
          errorReport: JSON.parse(JSON.stringify(failures)),
        },
      });
    }
  }

  if (batch.type === ImportType.COURSE_STUDENTS) {
    try {
      const summary = await executeCourseStudentRows(validation.validRows.map((entry) => entry.row as CourseStudentCsvRow), context);
      return prisma.importBatch.update({
        where: { id: batch.id },
        data: {
          status: failures.length > 0 && summary.processedCount === 0 ? ImportStatus.FAILED : ImportStatus.COMPLETED,
          dryRunSummary: validation.summary,
          executionSummary: summary,
          errorReport: JSON.parse(JSON.stringify(failures)),
        },
      });
    } catch (error) {
      failures.push({
        rowNumber: 1,
        idempotencyKey: "course-students",
        row: {},
        errors: [error instanceof Error ? error.message : "Unknown course student import error"],
      });
      return prisma.importBatch.update({
        where: { id: batch.id },
        data: {
          status: ImportStatus.FAILED,
          dryRunSummary: validation.summary,
          executionSummary: buildExecutionSummary(batch.type),
          errorReport: JSON.parse(JSON.stringify(failures)),
        },
      });
    }
  }

  const summary = buildExecutionSummary(batch.type);

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

export async function executeImport(type: ImportType, filename: string, csvContent: string, dryRun = true, context?: ImportContext) {
  const batch = await createImportBatch(type, filename, csvContent, dryRun, context);

  if (dryRun) {
    return batch;
  }

  return executeImportBatch(batch.id);
}
