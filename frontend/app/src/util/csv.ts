/** Minimal RFC-4180 CSV builder. */

/**
 * Spreadsheets execute a cell starting with `=`, `+`, `-`, `@`, tab or CR as a
 * formula, and exported cells carry attacker-controlled on-chain strings. The
 * leading `'` (OWASP) forces the cell to text. It also lands on legitimate
 * negative numbers — the accepted cost of exporting untrusted data.
 */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

function cell(value: string): string {
  const text = FORMULA_LEAD.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: ReadonlyArray<ReadonlyArray<string>>): string {
  return rows.map((r) => r.map(cell).join(",")).join("\r\n");
}
