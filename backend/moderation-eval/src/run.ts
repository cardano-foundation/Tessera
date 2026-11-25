/**
 * A run file: one provider's verdicts on the set, in `data/runs/`. The first
 * line names the provider; each next line is one item scored. A line is only
 * ever appended, so an item scored twice keeps its latest line.
 */
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DATA_DIR, readLines } from "./data.js";
import type { Category } from "./item.js";
import type { Provider } from "./provider.js";

export const RUNS_DIR = join(DATA_DIR, "runs");

export interface RunMeta {
  readonly provider: string;
  readonly model: string;
  readonly covers: readonly Category[];
}

export interface Scored {
  readonly id: string;
  /** Of the text the provider saw, so an edited item is scored again. */
  readonly hash: string;
  readonly scores: Partial<Record<Category, number>>;
  readonly ms: number;
  readonly raw?: unknown;
  readonly cost?: number;
  readonly error?: string;
}

export const runFile = (p: Provider): string =>
  join(RUNS_DIR, `${p.name}-${p.model}.jsonl`);

export const textHash = (text: string): string =>
  createHash("sha256").update(text).digest("hex").slice(0, 16);

export function readRun(file: string): { meta: RunMeta; lines: Scored[] } {
  const [first, ...rest] = readLines(file).map(({ value }) => value);
  if (!first) throw new Error(`${file} is empty`);
  return { meta: first as RunMeta, lines: rest as Scored[] };
}

/** The latest line per item. */
export function latest(lines: readonly Scored[]): Map<string, Scored> {
  return new Map(lines.map((line) => [line.id, line]));
}

export function appendLine(file: string, line: RunMeta | Scored): void {
  if (!existsSync(file)) mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, JSON.stringify(line) + "\n");
}
