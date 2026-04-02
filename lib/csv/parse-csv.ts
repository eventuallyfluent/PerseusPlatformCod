import Papa from "papaparse";

export function parseCsv<T>(input: string): T[] {
  const result = Papa.parse<T>(input, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors.map((error) => error.message).join(", "));
  }

  return result.data;
}
