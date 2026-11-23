import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import {
  itemProblems,
  type Category,
  type Item,
  type Severity,
} from "./item.js";

/** Git-ignored: item text never enters the repository. */
export const DATA_DIR = new URL("../data/", import.meta.url).pathname;

/**
 * Human reviews, kept apart from the item files so that regenerating a
 * synthetic file, or exporting on-chain items again, never drops a review.
 */
export const REVIEWS = join(DATA_DIR, "reviews.jsonl");

export interface Review {
  readonly id: string;
  readonly labels: Partial<Record<Category, Severity>>;
  readonly nearMiss?: readonly Category[];
  readonly note?: string;
  readonly reviewedBy: string;
}

/** The item files: every `.jsonl` in the data folder but the reviews. */
export function dataFiles(): string[] {
  mkdirSync(DATA_DIR, { recursive: true });
  return readdirSync(DATA_DIR)
    .filter(
      (name) => name.endsWith(".jsonl") && join(DATA_DIR, name) !== REVIEWS,
    )
    .sort()
    .map((name) => join(DATA_DIR, name));
}

/**
 * Every item, with its review applied, and every problem found on the way:
 * invalid items or reviews, duplicate ids, a `pairOf` or review naming no item.
 */
export function loadSet(): { items: Item[]; problems: string[] } {
  const problems: string[] = [];
  const byId = new Map<string, Item>();
  for (const file of dataFiles()) {
    for (const { line, value } of readLines(file)) {
      const where = `${basename(file)}:${line}`;
      const found = itemProblems(value);
      if (found.length > 0) {
        problems.push(...found.map((p) => `${where}: ${p}`));
        continue;
      }
      const item = value as Item;
      if (byId.has(item.id)) problems.push(`${where}: duplicate id ${item.id}`);
      byId.set(item.id, item);
    }
  }
  for (const review of readReviews()) {
    const item = byId.get(review.id);
    if (!item) {
      problems.push(`reviews.jsonl: no item ${review.id}`);
      continue;
    }
    const { nearMiss: _n, note: _o, ...unreviewed } = item;
    const reviewed = {
      ...unreviewed,
      labels: review.labels,
      ...(review.nearMiss?.length ? { nearMiss: review.nearMiss } : {}),
      ...((review.note ?? item.note) ? { note: review.note ?? item.note } : {}),
      reviewedBy: review.reviewedBy,
    };
    const found = itemProblems(reviewed);
    if (found.length > 0) {
      problems.push(...found.map((p) => `reviews.jsonl ${review.id}: ${p}`));
      continue;
    }
    byId.set(item.id, reviewed);
  }
  for (const item of byId.values()) {
    if (item.pairOf !== undefined && !byId.has(item.pairOf))
      problems.push(`${item.id}: pairOf ${item.pairOf} is not in the set`);
  }
  return { items: [...byId.values()], problems };
}

export function readReviews(): Review[] {
  return existsSync(REVIEWS)
    ? readLines(REVIEWS).map(({ value }) => value as Review)
    : [];
}

/** Adds or replaces reviews by id. */
export function writeReviews(reviews: readonly Review[]): void {
  const all = new Map(readReviews().map((r) => [r.id, r]));
  for (const review of reviews) all.set(review.id, review);
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    REVIEWS,
    [...all.values()].map((r) => JSON.stringify(r) + "\n").join(""),
  );
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
