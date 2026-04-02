import type { ImportType } from "@prisma/client";

export function getIdempotencyKey(type: ImportType, row: Record<string, string | number | boolean | undefined>) {
  switch (type) {
    case "INSTRUCTORS":
      return `instructor:${String(row.slug ?? "").trim()}`;
    case "COURSES":
      return `course:${String(row.legacy_course_id ?? row.slug ?? "").trim()}`;
    case "LESSONS":
      return `lesson:${String(row.legacy_course_id ?? "").trim()}:${String(row.module_position ?? "").trim()}:${String(row.lesson_position ?? "").trim()}`;
    case "OFFERS":
      return `offer:${String(row.legacy_course_id ?? "").trim()}:${String(row.offer_name ?? "").trim().toLowerCase()}`;
    default:
      return "unknown";
  }
}
