import { instructorCsvRowSchema } from "@/lib/zod/schemas";
import { validateRows } from "@/lib/imports/shared";

export function validateInstructorRows(rows: unknown[]) {
  return validateRows(rows as Record<string, string | number | boolean | undefined>[], instructorCsvRowSchema, "INSTRUCTORS");
}
