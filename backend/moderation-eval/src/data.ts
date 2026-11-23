import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Item } from "./item.js";

/** Git-ignored: item text never enters the repository. */
export const DATA_DIR = new URL("../data/", import.meta.url).pathname;

export function dataFiles(): string[] {
  mkdirSync(DATA_DIR, { recursive: true });
  return readdirSync(DATA_DIR)
    .filter((name) => name.endsWith(".jsonl"))
    .sort()
    .map((name) => join(DATA_DIR, name));
}

/** Each non-blank line parsed, with its 1-based line number. */
export function readLines(file: string): { line: number; value: unknown }[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .flatMap((text, i) => {
      if (!text.trim()) return [];
      try {
        return [{ line: i + 1, value: JSON.parse(text) as unknown }];
      } catch (error) {
        throw new Error(`${file}:${i + 1}: ${(error as Error).message}`);
      }
    });
}

export function writeItems(file: string, items: readonly Item[]): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    file,
    items.map((item) => JSON.stringify(item) + "\n").join(""),
  );
}
