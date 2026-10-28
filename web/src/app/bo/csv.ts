/**
 * Eksport CSV dla BO — UTF-8 BOM, separator `;` (Excel PL).
 */

export type CsvCell = string | number | boolean | null | undefined;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function boCsvFilename(resource: string): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `bo-${resource}-${stamp}.csv`;
}

function escapeCell(value: CsvCell): string {
  const raw = value == null ? "" : String(value);
  if (/[";\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function downloadBoCsv(
  resource: string,
  headers: string[],
  rows: CsvCell[][],
): void {
  const lines = [
    headers.map(escapeCell).join(";"),
    ...rows.map((row) => row.map(escapeCell).join(";")),
  ];
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = boCsvFilename(resource);
  a.click();
  URL.revokeObjectURL(url);
}
