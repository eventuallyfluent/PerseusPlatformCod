import { ImportType } from "@prisma/client";
import { parseCsv } from "@/lib/csv/parse-csv";
import { prisma } from "@/lib/db/prisma";
import { buildImportError } from "@/lib/imports/shared";
import { validateCourseRows } from "@/lib/imports/validate-courses";
import { validateInstructorRows } from "@/lib/imports/validate-instructors";
import { validateLessonRows } from "@/lib/imports/validate-lessons";
import { validateOfferRows } from "@/lib/imports/validate-offers";
import type { ImportDryRunSummary, ImportValidationResult } from "@/lib/imports/types";
import { validatePublicPathAvailability } from "@/lib/urls/validate-public-path";
import { coursePackageCsvRowSchema, courseStudentCsvRowSchema } from "@/lib/zod/schemas";
import { validateRows } from "@/lib/imports/shared";

export type ImportContext = {
  targetCourseId?: string;
};

type PackageRow = Record<string, string | number | boolean | undefined>;

function humanizeSlug(slug: string) {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function enrichCourseValidation(
  validation: ImportValidationResult<Record<string, unknown>>,
): Promise<ImportValidationResult<Record<string, unknown>>> {
  const validRows: ImportValidationResult<Record<string, unknown>>["validRows"] = [];
  const conflicts = [...validation.conflicts];
  const invalidRows = [...validation.invalidRows];

  for (const entry of validation.validRows) {
    const row = entry.row as Record<string, string>;
    const instructorName = String(row.instructor_name ?? "").trim() || humanizeSlug(String(row.instructor_slug ?? ""));

    if (!instructorName) {
      invalidRows.push(buildImportError(entry.rowNumber, entry.idempotencyKey, entry.row, ["instructor_name: Provide an instructor name or a usable instructor_slug"]));
      continue;
    }

    const desiredPath = row.legacy_url || `/course/${row.slug}`;
    const existingCourse =
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

    const isAvailable = await validatePublicPathAvailability(desiredPath, existingCourse?.id);
    if (!isAvailable) {
      conflicts.push(buildImportError(entry.rowNumber, entry.idempotencyKey, entry.row, [`legacy_url/publicPath conflict: ${desiredPath} is already reserved`]));
      continue;
    }

    validRows.push(entry);
  }

  return {
    validRows,
    invalidRows,
    conflicts,
  };
}

async function enrichLessonValidation(
  validation: ImportValidationResult<Record<string, unknown>>,
): Promise<ImportValidationResult<Record<string, unknown>>> {
  const validRows: ImportValidationResult<Record<string, unknown>>["validRows"] = [];
  const invalidRows = [...validation.invalidRows];

  for (const entry of validation.validRows) {
    const row = entry.row as Record<string, string>;
    const course = await prisma.course.findFirst({
      where: { legacyCourseId: row.legacy_course_id },
      select: { id: true },
    });

    if (!course) {
      invalidRows.push(buildImportError(entry.rowNumber, entry.idempotencyKey, entry.row, [`legacy_course_id: Course ${row.legacy_course_id} not found`]));
      continue;
    }

    validRows.push(entry);
  }

  return {
    validRows,
    invalidRows,
    conflicts: validation.conflicts,
  };
}

async function enrichOfferValidation(
  validation: ImportValidationResult<Record<string, unknown>>,
): Promise<ImportValidationResult<Record<string, unknown>>> {
  const validRows: ImportValidationResult<Record<string, unknown>>["validRows"] = [];
  const invalidRows = [...validation.invalidRows];

  for (const entry of validation.validRows) {
    const row = entry.row as Record<string, string>;
    const course = await prisma.course.findFirst({
      where: { legacyCourseId: row.legacy_course_id },
      select: { id: true },
    });

    if (!course) {
      invalidRows.push(buildImportError(entry.rowNumber, entry.idempotencyKey, entry.row, [`legacy_course_id: Course ${row.legacy_course_id} not found`]));
      continue;
    }

    validRows.push(entry);
  }

  return {
    validRows,
    invalidRows,
    conflicts: validation.conflicts,
  };
}

function getPackageMetaFields(row: PackageRow) {
  return {
    legacy_course_id: row.legacy_course_id ?? "",
    slug: row.slug ?? "",
    legacy_slug: row.legacy_slug ?? "",
    legacy_url: row.legacy_url ?? "",
    title: row.title ?? "",
    subtitle: row.subtitle ?? "",
    short_description: row.short_description ?? "",
    long_description: row.long_description ?? "",
    learning_outcomes: row.learning_outcomes ?? "",
    who_its_for: row.who_its_for ?? "",
    includes: row.includes ?? "",
    hero_image_url: row.hero_image_url ?? "",
    sales_video_url: row.sales_video_url ?? "",
    instructor_slug: row.instructor_slug ?? "",
    instructor_name: row.instructor_name ?? "",
    seo_title: row.seo_title ?? "",
    seo_description: row.seo_description ?? "",
    status: row.status ?? "",
  };
}

function getPackageTestimonialFields(row: PackageRow) {
  return {
    testimonial_name: String(row.testimonial_name ?? "").trim(),
    testimonial_email: String(row.testimonial_email ?? "").trim(),
    testimonial_quote: String(row.testimonial_quote ?? "").trim(),
    testimonial_position: String(row.testimonial_position ?? "").trim(),
  };
}

async function enrichCoursePackageValidation(
  validation: ImportValidationResult<PackageRow>,
): Promise<ImportValidationResult<PackageRow>> {
  const validRows: ImportValidationResult<PackageRow>["validRows"] = [];
  const invalidRows = [...validation.invalidRows];
  const conflicts = [...validation.conflicts];

  if (validation.validRows.length === 0) {
    return { validRows, invalidRows, conflicts };
  }

  const firstRow = validation.validRows[0].row;
  const canonicalMeta = getPackageMetaFields(firstRow);
  const instructorSlug = String(firstRow.instructor_slug);
  const derivedInstructorName = String(firstRow.instructor_name || "").trim() || humanizeSlug(instructorSlug);

  if (!derivedInstructorName) {
    return {
      validRows: [],
      invalidRows: [
        ...invalidRows,
        ...validation.validRows.map((entry) =>
          buildImportError(entry.rowNumber, entry.idempotencyKey, entry.row, ["instructor_name: Provide an instructor name or a usable instructor_slug"]),
        ),
      ],
      conflicts,
    };
  }

  const desiredPath = String(firstRow.legacy_url || "") || `/course/${String(firstRow.slug)}`;
  const existingCourse =
    (firstRow.legacy_course_id
      ? await prisma.course.findFirst({
          where: {
            OR: [{ legacyCourseId: String(firstRow.legacy_course_id) }, { slug: String(firstRow.slug) }],
          },
          select: { id: true },
        })
      : await prisma.course.findUnique({
          where: { slug: String(firstRow.slug) },
          select: { id: true },
        })) ?? null;

  const isAvailable = await validatePublicPathAvailability(desiredPath, existingCourse?.id);
  if (!isAvailable) {
    conflicts.push(
      buildImportError(validation.validRows[0].rowNumber, validation.validRows[0].idempotencyKey, validation.validRows[0].row, [
        `legacy_url/publicPath conflict: ${desiredPath} is already reserved`,
      ]),
    );
    return { validRows: [], invalidRows, conflicts };
  }

  const seenLessons = new Set<string>();

  for (const entry of validation.validRows) {
    const currentMeta = getPackageMetaFields(entry.row);
    const testimonial = getPackageTestimonialFields(entry.row);
    const mismatches = Object.entries(canonicalMeta)
      .filter(([key, value]) => String(currentMeta[key as keyof typeof currentMeta] ?? "") !== String(value ?? ""))
      .map(([key]) => `Course-level field ${key} must match across every row in the file`);

    if ((testimonial.testimonial_name || testimonial.testimonial_email) && !testimonial.testimonial_quote) {
      mismatches.push("testimonial_quote: Add the review text when providing testimonial_name or testimonial_email");
    }

    if (mismatches.length > 0) {
      invalidRows.push(buildImportError(entry.rowNumber, entry.idempotencyKey, entry.row, mismatches));
      continue;
    }

    const lessonKey = `${entry.row.module_position}:${entry.row.lesson_position}`;
    if (seenLessons.has(lessonKey)) {
      conflicts.push(buildImportError(entry.rowNumber, entry.idempotencyKey, entry.row, [`Duplicate lesson position pair ${lessonKey} in this file`]));
      continue;
    }

    seenLessons.add(lessonKey);
    validRows.push(entry);
  }

  return {
    validRows,
    invalidRows,
    conflicts,
  };
}

async function enrichCourseStudentsValidation(
  validation: ImportValidationResult<Record<string, unknown>>,
  context?: ImportContext,
): Promise<ImportValidationResult<Record<string, unknown>>> {
  if (!context?.targetCourseId) {
    throw new Error("Course student imports require a target course");
  }

  const course = await prisma.course.findUnique({
    where: { id: context.targetCourseId },
    select: { id: true },
  });

  if (!course) {
    throw new Error("Target course not found");
  }

  return validation;
}

function buildSummary(
  type: ImportType,
  totalRows: number,
  validation: ImportValidationResult<Record<string, unknown>>,
  context?: ImportContext,
): ImportDryRunSummary {
  const summary: ImportDryRunSummary = {
    type,
    totalRows,
    validCount: validation.validRows.length,
    invalidCount: validation.invalidRows.length,
    conflictCount: validation.conflicts.length,
  };

  if (type === ImportType.COURSE_PACKAGE && validation.validRows[0]) {
    const firstRow = validation.validRows[0].row as PackageRow;
    summary.targetCourseSlug = String(firstRow.slug);
    summary.targetCourseTitle = String(firstRow.title);
    summary.moduleCount = new Set(validation.validRows.map((entry) => String((entry.row as PackageRow).module_position))).size;
    summary.lessonCount = validation.validRows.length;
    summary.testimonialCount = new Set(
      validation.validRows
        .map((entry) => {
          const row = entry.row as PackageRow;
          const quote = String(row.testimonial_quote ?? "").trim();
          if (!quote) return "";
          const email = String(row.testimonial_email ?? "").trim().toLowerCase();
          const name = String(row.testimonial_name ?? "").trim().toLowerCase();
          return email || `${name}:${quote.toLowerCase()}`;
        })
        .filter(Boolean),
    ).size;
  }

  if (type === ImportType.COURSE_STUDENTS && context?.targetCourseId) {
    summary.targetCourseId = context.targetCourseId;
  }

  return summary;
}

export async function dryRunImport(type: ImportType, csvContent: string, context?: ImportContext) {
  const rows = parseCsv<Record<string, string>>(csvContent);

  let validation: ImportValidationResult<Record<string, unknown>>;

  switch (type) {
    case ImportType.INSTRUCTORS:
      validation = validateInstructorRows(rows) as ImportValidationResult<Record<string, unknown>>;
      break;
    case ImportType.COURSES:
      validation = await enrichCourseValidation(validateCourseRows(rows) as ImportValidationResult<Record<string, unknown>>);
      break;
    case ImportType.LESSONS:
      validation = await enrichLessonValidation(validateLessonRows(rows) as ImportValidationResult<Record<string, unknown>>);
      break;
    case ImportType.OFFERS:
      validation = await enrichOfferValidation(validateOfferRows(rows) as ImportValidationResult<Record<string, unknown>>);
      break;
    case ImportType.COURSE_PACKAGE:
      validation = await enrichCoursePackageValidation(validateRows(rows, coursePackageCsvRowSchema, type) as ImportValidationResult<PackageRow>);
      break;
    case ImportType.COURSE_STUDENTS:
      validation = await enrichCourseStudentsValidation(validateRows(rows, courseStudentCsvRowSchema, type) as ImportValidationResult<Record<string, unknown>>, context);
      break;
    default:
      throw new Error(`Unsupported import type ${type}`);
  }

  return {
    summary: buildSummary(type, rows.length, validation, context),
    ...validation,
  };
}
