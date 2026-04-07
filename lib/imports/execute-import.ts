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
type ImportedTestimonial = {
  name: string;
  email: string | null;
  quote: string;
  rating: number;
  position: number;
};
type ValidatedImportRow<Row> = {
  rowNumber: number;
  idempotencyKey: string;
  row: Row;
};
type PersistedImportContext<Row = Record<string, unknown>> = ImportContext & {
  preparedRows?: ValidatedImportRow<Row>[];
};

const IMPORT_CHUNK_SIZE = 20;

function humanizeSlug(slug: string) {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildExecutionSummary(type: ImportType, totalCount = 0): ImportExecutionSummary {
  return {
    type,
    createdCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    processedCount: 0,
    cursor: 0,
    totalCount,
    hasMore: totalCount > 0,
    lessonsApplied: false,
    testimonialsApplied: false,
  };
}

function normalizeExecutionSummary(type: ImportType, raw: unknown, totalCount = 0): ImportExecutionSummary {
  const summary = raw && typeof raw === "object" ? (raw as Partial<ImportExecutionSummary>) : {};

  return {
    ...buildExecutionSummary(type, totalCount),
    ...summary,
    type,
    totalCount,
    cursor: typeof summary.cursor === "number" ? summary.cursor : 0,
    hasMore: typeof summary.hasMore === "boolean" ? summary.hasMore : totalCount > (typeof summary.cursor === "number" ? summary.cursor : 0),
  };
}

function normalizeErrorReport(raw: unknown): ImportRowError[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((entry): entry is ImportRowError => typeof entry === "object" && entry !== null && "errors" in entry);
}

function serializeJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function buildProcessingSummary(type: ImportType, totalCount = 0) {
  return buildExecutionSummary(type, totalCount);
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

function collectImportedTestimonials(rows: CoursePackageCsvRow[]): ImportedTestimonial[] {
  const testimonials = new Map<string, ImportedTestimonial>();

  for (const row of rows) {
    const quote = String(row.testimonial_quote ?? "").trim();
    if (!quote) continue;

    const email = String(row.testimonial_email ?? "").trim().toLowerCase() || null;
    const name = String(row.testimonial_name ?? "").trim() || "Payhip student";
    const rating = row.testimonial_rating ?? 5;
    const position = row.testimonial_position ?? testimonials.size + 1;
    const key = email || `${name.toLowerCase()}:${quote.toLowerCase()}`;

    if (!testimonials.has(key)) {
      testimonials.set(key, {
        name,
        email,
        quote,
        rating,
        position,
      });
    }
  }

  return [...testimonials.values()].sort((a, b) => a.position - b.position);
}

async function ensureCoursePackageTarget(rows: CoursePackageCsvRow[], summary: ImportExecutionSummary) {
  if (rows.length === 0) {
    return null;
  }

  if (summary.targetCourseId) {
    return prisma.course.findUnique({
      where: { id: summary.targetCourseId },
      select: { id: true, slug: true, title: true },
    });
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
  summary.testimonialCount = collectImportedTestimonials(rows).length;
  summary.totalCount = rows.length;
  summary.hasMore = rows.length > 0;

  if (existingCourse) {
    summary.updatedCount += 1;
  } else {
    summary.createdCount += 1;
  }

  return course;
}

async function applyCoursePackageLessonRow(courseId: string, row: CoursePackageCsvRow, summary: ImportExecutionSummary) {
  const existingModule = await prisma.module.findUnique({
    where: {
      courseId_position: {
        courseId,
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
        courseId,
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
    return;
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
    return;
  }

  await prisma.lesson.update({
    where: { id: existingLesson.id },
    data: lessonPayload,
  });
  summary.updatedLessonCount = (summary.updatedLessonCount ?? 0) + 1;
  summary.updatedCount += 1;
}

async function applyCoursePackageTestimonials(courseId: string, rows: CoursePackageCsvRow[], summary: ImportExecutionSummary) {
  for (const testimonial of collectImportedTestimonials(rows)) {
    const existingTestimonial = testimonial.email
      ? await prisma.testimonial.findFirst({
          where: {
            courseId,
            email: testimonial.email,
          },
        })
      : await prisma.testimonial.findFirst({
          where: {
            courseId,
            name: testimonial.name,
            quote: testimonial.quote,
          },
        });

    const data = {
      name: testimonial.name,
      email: testimonial.email,
      quote: testimonial.quote,
      rating: testimonial.rating,
      position: testimonial.position,
      isApproved: true,
    };

    if (!existingTestimonial) {
      await prisma.testimonial.create({
        data: {
          courseId,
          ...data,
        },
      });
      summary.createdTestimonialCount = (summary.createdTestimonialCount ?? 0) + 1;
      continue;
    }

    const unchanged =
      existingTestimonial.name === data.name &&
      existingTestimonial.email === data.email &&
      existingTestimonial.quote === data.quote &&
      existingTestimonial.rating === data.rating &&
      existingTestimonial.position === data.position &&
      existingTestimonial.isApproved === data.isApproved;

    if (unchanged) {
      continue;
    }

    await prisma.testimonial.update({
      where: { id: existingTestimonial.id },
      data,
    });
    summary.updatedTestimonialCount = (summary.updatedTestimonialCount ?? 0) + 1;
  }

  summary.testimonialsApplied = true;
}

async function processCoursePackageChunk(
  entries: ValidatedImportRow<CoursePackageCsvRow>[],
  summary: ImportExecutionSummary,
  failures: ImportRowError[],
) {
  const rows = entries.map((entry) => entry.row);
  const course = await ensureCoursePackageTarget(rows, summary);

  if (!course) {
    summary.lessonsApplied = true;
    summary.testimonialsApplied = true;
    summary.hasMore = false;
    return summary;
  }

  const cursor = summary.cursor ?? 0;
  const chunk = entries.slice(cursor, cursor + IMPORT_CHUNK_SIZE);

  for (const entry of chunk) {
    try {
      await applyCoursePackageLessonRow(course.id, entry.row, summary);
    } catch (error) {
      summary.failedCount += 1;
      failures.push({
        rowNumber: entry.rowNumber,
        idempotencyKey: entry.idempotencyKey,
        row: entry.row,
        errors: [error instanceof Error ? error.message : "Unknown course package import error"],
      });
    } finally {
      summary.processedCount += 1;
    }
  }

  const nextCursor = cursor + chunk.length;
  summary.cursor = nextCursor;
  summary.lessonsApplied = nextCursor >= entries.length;
  summary.hasMore = nextCursor < entries.length || !summary.testimonialsApplied;

  if (summary.lessonsApplied && !summary.testimonialsApplied) {
    await applyCoursePackageTestimonials(course.id, rows, summary);
    summary.hasMore = false;
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

async function processCourseStudentChunk(
  entries: ValidatedImportRow<CourseStudentCsvRow>[],
  summary: ImportExecutionSummary,
  failures: ImportRowError[],
  context?: ImportContext,
) {
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

  summary.targetCourseId = course.id;
  summary.targetCourseSlug = course.slug;
  summary.targetCourseTitle = course.title;
  summary.totalCount = entries.length;

  const cursor = summary.cursor ?? 0;
  const chunk = entries.slice(cursor, cursor + IMPORT_CHUNK_SIZE);

  for (const entry of chunk) {
    try {
      const result = await executeCourseStudentRow(entry.row, course.id);
      if (result === "created") summary.createdCount += 1;
      if (result === "updated") summary.updatedCount += 1;
      if (result === "skipped") summary.skippedCount += 1;
    } catch (error) {
      summary.failedCount += 1;
      failures.push({
        rowNumber: entry.rowNumber,
        idempotencyKey: entry.idempotencyKey,
        row: entry.row,
        errors: [error instanceof Error ? error.message : "Unknown course student import error"],
      });
    } finally {
      summary.processedCount += 1;
    }
  }

  const nextCursor = cursor + chunk.length;
  summary.cursor = nextCursor;
  summary.lessonsApplied = true;
  summary.testimonialsApplied = true;
  summary.hasMore = nextCursor < entries.length;

  return summary;
}

async function processLegacyImportBatch(
  batchType: ImportType,
  validationRows: ValidatedImportRow<InstructorCsvRow | CourseCsvRow | LessonCsvRow | OfferCsvRow>[],
  summary: ImportExecutionSummary,
  failures: ImportRowError[],
) {
  for (const entry of validationRows) {
    try {
      let result: "created" | "updated" | "skipped";
      if (batchType === ImportType.INSTRUCTORS) {
        result = await executeInstructorRow(entry.row as InstructorCsvRow);
      } else if (batchType === ImportType.COURSES) {
        result = await executeCourseRow(entry.row as CourseCsvRow);
      } else if (batchType === ImportType.LESSONS) {
        result = await executeLessonRow(entry.row as LessonCsvRow);
      } else {
        result = await executeOfferRow(entry.row as OfferCsvRow);
      }

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
    } finally {
      summary.processedCount += 1;
    }
  }

  summary.cursor = validationRows.length;
  summary.totalCount = validationRows.length;
  summary.hasMore = false;
  summary.lessonsApplied = true;
  summary.testimonialsApplied = true;

  return summary;
}

function buildFailureStatus(summary: ImportExecutionSummary, failures: ImportRowError[]) {
  if (failures.length > 0 && summary.processedCount === 0) {
    return ImportStatus.FAILED;
  }

  return summary.hasMore ? ImportStatus.PROCESSING : ImportStatus.COMPLETED;
}

async function updateBatchProgress(batchId: string, status: ImportStatus, summary: ImportExecutionSummary, failures: ImportRowError[]) {
  return prisma.importBatch.update({
    where: { id: batchId },
    data: {
      status,
      executionSummary: serializeJson(summary),
      errorReport: serializeJson(failures),
    },
  });
}

async function processChunkedBatch(batchId: string) {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
  });

  if (!batch) {
    throw new Error("Import batch not found");
  }

  if (!batch.sourceContent) {
    throw new Error("Import batch source content is missing");
  }

  const persistedContext = (batch.context as PersistedImportContext<CoursePackageCsvRow | CourseStudentCsvRow> | null) ?? undefined;
  const context = persistedContext ? { targetCourseId: persistedContext.targetCourseId } : undefined;
  const validation = persistedContext?.preparedRows ? null : await dryRunImport(batch.type, batch.sourceContent, context);
  const validRows = (persistedContext?.preparedRows ?? validation?.validRows ?? []) as ValidatedImportRow<CoursePackageCsvRow | CourseStudentCsvRow>[];
  const failures = normalizeErrorReport(batch.errorReport);

  if (failures.length === 0) {
    failures.push(...(validation?.invalidRows ?? []), ...(validation?.conflicts ?? []));
  }

  const summary = normalizeExecutionSummary(batch.type, batch.executionSummary, validRows.length);

  if (batch.type === ImportType.COURSE_PACKAGE) {
    await processCoursePackageChunk(validRows as ValidatedImportRow<CoursePackageCsvRow>[], summary, failures);
    return updateBatchProgress(batch.id, buildFailureStatus(summary, failures), summary, failures);
  }

  if (batch.type === ImportType.COURSE_STUDENTS) {
    await processCourseStudentChunk(validRows as ValidatedImportRow<CourseStudentCsvRow>[], summary, failures, context);
    return updateBatchProgress(batch.id, buildFailureStatus(summary, failures), summary, failures);
  }

  await processLegacyImportBatch(
    batch.type,
    validRows as ValidatedImportRow<InstructorCsvRow | CourseCsvRow | LessonCsvRow | OfferCsvRow>[],
    summary,
    failures,
  );
  return updateBatchProgress(batch.id, buildFailureStatus(summary, failures), summary, failures);
}

export async function createImportBatch(type: ImportType, filename: string, csvContent: string, dryRun = true, context?: ImportContext) {
  const validation = await dryRunImport(type, csvContent, context);
  const totalCount = validation.validRows.length;
  const persistedContext: PersistedImportContext = {
    ...(context ?? {}),
    preparedRows: validation.validRows as ValidatedImportRow<Record<string, unknown>>[],
  };

  return prisma.importBatch.create({
    data: {
      type,
      filename,
      sourceContent: csvContent,
      context: serializeJson(persistedContext),
      status: dryRun ? ImportStatus.DRY_RUN : ImportStatus.PROCESSING,
      dryRunSummary: serializeJson(validation.summary),
      errorReport: serializeJson([...validation.invalidRows, ...validation.conflicts]),
      executionSummary: serializeJson(buildProcessingSummary(type, totalCount)),
    },
  });
}

export async function startImportBatch(batchId: string) {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
  });

  if (!batch) {
    throw new Error("Import batch not found");
  }

  const totalCount =
    batch.dryRunSummary && typeof batch.dryRunSummary === "object" && batch.dryRunSummary !== null && "validCount" in batch.dryRunSummary
      ? Number((batch.dryRunSummary as Record<string, unknown>).validCount ?? 0)
      : 0;

  return prisma.importBatch.update({
    where: { id: batchId },
    data: {
      status: ImportStatus.PROCESSING,
      executionSummary: serializeJson(normalizeExecutionSummary(batch.type, batch.executionSummary, totalCount)),
    },
  });
}

export async function createFailedImportBatch(type: ImportType, filename: string, csvContent: string, error: unknown, context?: ImportContext) {
  return prisma.importBatch.create({
    data: {
      type,
      filename,
      sourceContent: csvContent,
      context: context ? serializeJson(context) : undefined,
      status: ImportStatus.FAILED,
      dryRunSummary: {
        type,
        totalRows: 0,
        validCount: 0,
        invalidCount: 0,
        conflictCount: 0,
      },
      executionSummary: serializeJson(buildExecutionSummary(type)),
      errorReport: serializeJson([
        {
          rowNumber: 1,
          idempotencyKey: "request",
          row: {},
          errors: [error instanceof Error ? error.message : "Unknown import error"],
        },
      ]),
    },
  });
}

export async function markImportBatchFailed(batchId: string, error: unknown) {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    select: { type: true, executionSummary: true, dryRunSummary: true },
  });

  const totalCount =
    batch?.dryRunSummary && typeof batch.dryRunSummary === "object" && batch.dryRunSummary !== null && "validCount" in batch.dryRunSummary
      ? Number((batch.dryRunSummary as Record<string, unknown>).validCount ?? 0)
      : 0;

  return prisma.importBatch.update({
    where: { id: batchId },
    data: {
      status: ImportStatus.FAILED,
      executionSummary: serializeJson(normalizeExecutionSummary(batch?.type ?? ImportType.COURSE_PACKAGE, batch?.executionSummary, totalCount)),
      errorReport: serializeJson([
        {
          rowNumber: 1,
          idempotencyKey: "execution",
          row: {},
          errors: [error instanceof Error ? error.message : "Unknown import execution error"],
        },
      ]),
    },
  });
}

export async function processImportBatchChunk(batchId: string) {
  try {
    return await processChunkedBatch(batchId);
  } catch (error) {
    return markImportBatchFailed(batchId, error);
  }
}

export async function executeImportBatch(batchId: string) {
  let batch = await startImportBatch(batchId);

  while (batch.status === ImportStatus.PROCESSING) {
    batch = await processImportBatchChunk(batchId);
  }

  return batch;
}

export async function executeImport(type: ImportType, filename: string, csvContent: string, dryRun = true, context?: ImportContext) {
  const batch = await createImportBatch(type, filename, csvContent, dryRun, context);

  if (dryRun) {
    return batch;
  }

  return executeImportBatch(batch.id);
}
