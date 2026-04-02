import { lessonCsvRowSchema } from "@/lib/zod/schemas";
import { validateRows } from "@/lib/imports/shared";

export function validateLessonRows(rows: unknown[]) {
  return validateRows(rows as Record<string, string | number | boolean | undefined>[], lessonCsvRowSchema, "LESSONS");
}
