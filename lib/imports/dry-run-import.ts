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

async function enrichCourseValidation(
  validation: ImportValidationResult<Record<string, unknown>>,
): Promise<ImportValidationResult<Record<string, unknown>>> {
  const validRows = [];
  const conflicts = [...validation.conflicts];
  const invalidRows = [...validation.invalidRows];

  for (const entry of validation.validRows) {
    const row = entry.row as Record<string, string>;
    const instructor = await prisma.instructor.findUnique({
      where: { slug: row.instructor_slug },
      select: { id: true },
    });

    if (!instructor) {
      invalidRows.push(buildImportError(entry.rowNumber, entry.idempotencyKey, entry.row, [`instructor_slug: Instructor ${row.instructor_slug} not found`]));
      continue;
    }

    const desiredPath = row.legacy_url || `/course/${row.slug}`;
    const existingCourse =
      (row.legacy_course_id
        ? await prisma.course.findFirst({
            where: {
              OR: [{ legacyCourseId: row.legacy_course_id }, { slug: row.slug }],
            },
            select: { id: true, publicPath: true, legacyUrl: true },
          })
        : await prisma.course.findUnique({
            where: { slug: row.slug },
            select: { id: true, publicPath: true, legacyUrl: true },
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
  const validRows = [];
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
  const validRows = [];
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

function buildSummary(type: ImportType, totalRows: number, validation: ImportValidationResult<Record<string, unknown>>): ImportDryRunSummary {
  return {
    type,
    totalRows,
    validCount: validation.validRows.length,
    invalidCount: validation.invalidRows.length,
    conflictCount: validation.conflicts.length,
  };
}

export async function dryRunImport(type: ImportType, csvContent: string) {
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
    default:
      throw new Error(`Unsupported import type ${type}`);
  }

  return {
    summary: buildSummary(type, rows.length, validation),
    ...validation,
  };
}
