import { courseCsvRowSchema } from "@/lib/zod/schemas";
import { validateRows } from "@/lib/imports/shared";

export function validateCourseRows(rows: unknown[]) {
  return validateRows(rows as Record<string, string | number | boolean | undefined>[], courseCsvRowSchema, "COURSES");
}
