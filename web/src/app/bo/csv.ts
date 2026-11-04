/**
 * Eksport CSV dla BO — wrapper nad wspólnym `lib/downloadCsv`.
 */
import { downloadCsv, type CsvCell } from "../lib/downloadCsv";

export type { CsvCell };

export function downloadBoCsv(
  resource: string,
  headers: string[],
  rows: CsvCell[][],
): void {
  downloadCsv("bo", resource, headers, rows);
}
