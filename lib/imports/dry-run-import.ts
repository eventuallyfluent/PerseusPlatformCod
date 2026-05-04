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
import { normalizePublicPathInput } from "@/lib/urls/normalize-public-path";
import { coursePackageCsvRowSchema, courseStudentCsvRowSchema } from "@/lib/zod/schemas";
import { validateRows } from "@/lib/imports/shared";

export type ImportContext = {
  targetCourseId?: string;
};

type PackageRow = Record<string, string | number | boolean | undefined>;

const COURSE_PACKAGE_CARRY_FIELDS = [
  "legacy_course_id",
  "slug",
  "legacy_slug",
  "legacy_url",
  "title",
  "subtitle",
  "short_description",
  "long_description",
  "learning_outcomes",
  "who_its_for",
  "includes",
  "hero_image_url",
  "sales_video_url",
  "instructor_slug",
  "instructor_name",
  "seo_title",
  "seo_description",
  "status",
  "price",
  "currency",
  "compare_at_price",
  "testimonial_name",
  "testimonial_email",
  "testimonial_quote",
  "testimonial_rating",
  "testimonial_position",
] as const;

const COURSE_PACKAGE_MODULE_FIELDS = ["module_position", "module_title"] as const;

function humanizeSlug(slug: string) {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeCoursePackageRows(rows: Record<string, string>[]) {
  const normalizedRows: Record<string, string>[] = [];
  const currentCourse: Record<string, string> = {};
  const currentModule: Record<string, string> = {};

  for (const row of rows) {
    const normalizedRow: Record<string, string> = { ...row };

    for (const field of COURSE_PACKAGE_CARRY_FIELDS) {
      const rawValue = String(row[field] ?? "");
      if (rawValue.trim()) {
        currentCourse[field] = rawValue;
      } else if (field in currentCourse) {
        normalizedRow[field] = currentCourse[field];
      }
    }

    for (const field of COURSE_PACKAGE_MODULE_FIELDS) {
      const rawValue = String(row[field] ?? "");
      if (rawValue.trim()) {
        currentModule[field] = rawValue;
      } else if (field in currentModule) {
        normalizedRow[field] = currentModule[field];
      }
    }

    const normalizedInstructorSlug = String(normalizedRow.instructor_slug ?? "").trim();
    const normalizedInstructorName = String(normalizedRow.instructor_name ?? "").trim();

    if (!normalizedInstructorSlug && !normalizedInstructorName) {
      normalizedRow.instructor_slug = "perseus-staff";
      normalizedRow.instructor_name = "Perseus Staff";
      currentCourse.instructor_slug = "perseus-staff";
      currentCourse.instructor_name = "Perseus Staff";
    } else if (!normalizedInstructorSlug && normalizedInstructorName) {
      const derivedSlug = normalizedInstructorName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      normalizedRow.instructor_slug = derivedSlug || "perseus-staff";
      currentCourse.instructor_slug = normalizedRow.instructor_slug;
    } else if (normalizedInstructorSlug && !normalizedInstructorName) {
      normalizedRow.instructor_name = humanizeSlug(normalizedInstructorSlug);
      currentCourse.instructor_name = normalizedRow.instructor_name;
    }

    normalizedRows.push(normalizedRow);
  }

  return normalizedRows;
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

    const desiredPath = normalizePublicPathInput(row.legacy_url) ?? `/course/${row.slug}`;
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

function getGeneratedCopyWarnings(row: PackageRow) {
  const warnings: string[] = [];
  const generatedCopyPatterns = [
    /\bpublic page (?:describes|says|states|mentions)\b/i,
    /\bpage (?:describes|says|states|mentions) (?:it|this)\b/i,
    /\bdescribed on the public page\b/i,
    /\baccording to the public page\b/i,
    /\bthe source page\b/i,
  ];
  const fields = [
    ["short_description", row.short_description],
    ["long_description", row.long_description],
    ["seo_description", row.seo_description],
  ] as const;

  for (const [field, value] of fields) {
    const text = String(value ?? "");
    if (generatedCopyPatterns.some((pattern) => pattern.test(text))) {
      warnings.push(`${field}: Looks like generated commentary about the source page, not original course copy. Paste the actual course text before importing.`);
    }
  }

  return warnings;
}

function getPackageTestimonialFields(row: PackageRow) {
  return {
    testimonial_name: String(row.testimonial_name ?? "").trim(),
    testimonial_email: String(row.testimonial_email ?? "").trim(),
    testimonial_quote: String(row.testimonial_quote ?? "").trim(),
    testimonial_rating: String(row.testimonial_rating ?? "").trim(),
    testimonial_position: String(row.testimonial_position ?? "").trim(),
  };
}

function getPackageHeroImageUrl(rows: PackageRow[]) {
  return rows.map((row) => String(row.hero_image_url ?? "").trim()).find(Boolean);
}

function hasPackageLessonFields(row: PackageRow) {
  return [
    row.module_position,
    row.module_title,
    row.lesson_position,
    row.lesson_slug,
    row.lesson_title,
  ].some((value) => String(value ?? "").trim().length > 0);
}

function getMissingPackageLessonFields(row: PackageRow) {
  const missing: string[] = [];

  if (!String(row.module_position ?? "").trim()) missing.push("module_position");
  if (!String(row.module_title ?? "").trim()) missing.push("module_title");
  if (!String(row.lesson_position ?? "").trim()) missing.push("lesson_position");
  if (!String(row.lesson_slug ?? "").trim()) missing.push("lesson_slug");
  if (!String(row.lesson_title ?? "").trim()) missing.push("lesson_title");

  return missing;
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

  const desiredPath = normalizePublicPathInput(String(firstRow.legacy_url || "")) ?? `/course/${String(firstRow.slug)}`;
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
    mismatches.push(...getGeneratedCopyWarnings(entry.row));

    if ((testimonial.testimonial_name || testimonial.testimonial_email) && !testimonial.testimonial_quote) {
      mismatches.push("testimonial_quote: Add the review text when providing testimonial_name or testimonial_email");
    }

    const hasLessonFields = hasPackageLessonFields(entry.row);
    const missingLessonFields = getMissingPackageLessonFields(entry.row);
    if (hasLessonFields && missingLessonFields.length > 0) {
      mismatches.push(...missingLessonFields.map((field) => `${field}: Required for lesson rows`));
    }

    if (!hasLessonFields && !testimonial.testimonial_quote) {
      mismatches.push("lesson row or testimonial_quote: Add lesson fields or review text");
    }

    if (mismatches.length > 0) {
      invalidRows.push(buildImportError(entry.rowNumber, entry.idempotencyKey, entry.row, mismatches));
      continue;
    }

    if (!hasLessonFields) {
      validRows.push(entry);
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
    const rows = validation.validRows.map((entry) => entry.row as PackageRow);
    summary.targetCourseSlug = String(firstRow.slug);
    summary.targetCourseTitle = String(firstRow.title);
    summary.shortDescription = String(firstRow.short_description ?? "");
    summary.longDescription = String(firstRow.long_description ?? "");
    const lessonRows = rows.filter(hasPackageLessonFields);
    summary.moduleCount = new Set(lessonRows.map((row) => String(row.module_position))).size;
    summary.lessonCount = lessonRows.length;
    summary.heroImageUrl = getPackageHeroImageUrl(rows);
    summary.hasHeroImage = Boolean(summary.heroImageUrl);
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
  const parsedRows = parseCsv<Record<string, string>>(csvContent);
  const rows = type === ImportType.COURSE_PACKAGE ? normalizeCoursePackageRows(parsedRows) : parsedRows;

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
