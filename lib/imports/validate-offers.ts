import { offerCsvRowSchema } from "@/lib/zod/schemas";
import { validateRows } from "@/lib/imports/shared";

export function validateOfferRows(rows: unknown[]) {
  return validateRows(rows as Record<string, string | number | boolean | undefined>[], offerCsvRowSchema, "OFFERS");
}
