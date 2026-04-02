import { z, type ZodType } from "zod";
import type { ImportRowError, ImportValidationResult } from "@/lib/imports/types";
import { getIdempotencyKey } from "@/lib/imports/idempotency";
import type { ImportType } from "@prisma/client";

export function validateRows<Row extends Record<string, string | number | boolean | undefined>>(
  rows: Row[],
  schema: ZodType<Row>,
  type: ImportType,
): ImportValidationResult<Row> {
  return rows.reduce<ImportValidationResult<Row>>(
    (acc, row, index) => {
      const result = schema.safeParse(row);
      const idempotencyKey = getIdempotencyKey(type, row);
      if (result.success) {
        acc.validRows.push({
          rowNumber: index + 2,
          idempotencyKey,
          row: result.data,
        });
      } else {
        acc.invalidRows.push({
          rowNumber: index + 2,
          idempotencyKey,
          row,
          errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
        });
      }
      return acc;
    },
    { validRows: [], invalidRows: [], conflicts: [] },
  );
}

export function normalizeStatus<T extends string>(value: T, allowed: readonly T[]) {
  const normalized = value.toUpperCase() as T;

  if (!allowed.includes(normalized)) {
    throw new Error(`Invalid status ${value}`);
  }

  return normalized;
}

export function parseBoolean(value: string | boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  return z.coerce.boolean().parse(value);
}

export function buildImportError<Row>(
  rowNumber: number,
  idempotencyKey: string,
  row: Row,
  errors: string[],
): ImportRowError<Row> {
  return {
    rowNumber,
    idempotencyKey,
    row,
    errors,
  };
}
