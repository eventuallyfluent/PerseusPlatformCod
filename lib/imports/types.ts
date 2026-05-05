import type { ImportType } from "@prisma/client";

export type ImportRowError<Row = unknown> = {
  rowNumber: number;
  idempotencyKey: string;
  errors: string[];
  row: Row;
};

export type ImportValidationResult<Row = unknown> = {
  validRows: Array<{ rowNumber: number; idempotencyKey: string; row: Row }>;
  invalidRows: ImportRowError<Row>[];
  conflicts: ImportRowError<Row>[];
};

export type ImportDryRunSummary = {
  type: ImportType;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  conflictCount: number;
  targetCourseId?: string;
  targetCourseSlug?: string;
  targetCourseTitle?: string;
  shortDescription?: string;
  longDescription?: string;
  moduleCount?: number;
  lessonCount?: number;
  heroImageUrl?: string;
  hasHeroImage?: boolean;
  testimonialCount?: number;
  offerOptionCount?: number;
};

export type ImportExecutionSummary = {
  type: ImportType;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  processedCount: number;
  cursor?: number;
  totalCount?: number;
  hasMore?: boolean;
  lessonsApplied?: boolean;
  testimonialsApplied?: boolean;
  courseMetadataApplied?: boolean;
  courseOffersApplied?: boolean;
  targetCourseId?: string;
  targetCourseSlug?: string;
  targetCourseTitle?: string;
  shortDescription?: string;
  longDescription?: string;
  moduleCount?: number;
  lessonCount?: number;
  heroImageUrl?: string;
  hasHeroImage?: boolean;
  testimonialCount?: number;
  offerOptionCount?: number;
  importedTestimonialCount?: number;
  createdModuleCount?: number;
  updatedModuleCount?: number;
  createdLessonCount?: number;
  updatedLessonCount?: number;
  createdTestimonialCount?: number;
  updatedTestimonialCount?: number;
};
