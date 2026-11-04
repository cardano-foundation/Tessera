/** Trigger a browser download of `content` as `filename` (the one side effect). */
export function download(
  filename: string,
  content: BlobPart,
  type = "text/plain;charset=utf-8",
): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  try {
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadCsv(filename: string, csv: string): void {
  download(filename, csv, "text/csv;charset=utf-8");
}

export function downloadJson(filename: string, json: string): void {
  download(filename, json, "application/json;charset=utf-8");
}
