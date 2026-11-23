/**
 * Validates every data file and prints the set's coverage: positives per
 * category and severity, near misses, and items per language by review state.
 * Exits non-zero on any invalid item, duplicate id or dangling `pairOf`.
 *
 *   pnpm --filter tessera-moderation-eval check
 */
import { basename } from "node:path";
import { dataFiles, readLines } from "./data.js";
import { CATEGORIES, itemProblems, type Item } from "./item.js";

const problems: string[] = [];
const items: Item[] = [];
const seen = new Set<string>();
for (const file of dataFiles()) {
  for (const { line, value } of readLines(file)) {
    const where = `${basename(file)}:${line}`;
    const found = itemProblems(value);
    if (found.length > 0) {
      problems.push(...found.map((p) => `${where}: ${p}`));
      continue;
    }
    const item = value as Item;
    if (seen.has(item.id)) problems.push(`${where}: duplicate id ${item.id}`);
    seen.add(item.id);
    items.push(item);
  }
}
for (const item of items) {
  if (item.pairOf !== undefined && !seen.has(item.pairOf))
    problems.push(`${item.id}: pairOf ${item.pairOf} is not in the set`);
}

const table = (rows: (string | number)[][]) => {
  const widths = rows[0]!.map((_, c) =>
    Math.max(...rows.map((r) => String(r[c]).length)),
  );
  for (const row of rows)
    console.log(
      row.map((cell, c) => String(cell).padEnd(widths[c]!)).join("  "),
    );
  console.log();
};

const labelled = items.filter((item) => item.labels !== undefined);
table([
  ["category", "unlawful", "policy", "near miss"],
  ...CATEGORIES.map((category) => [
    category,
    labelled.filter((i) => i.labels![category] === "unlawful").length,
    labelled.filter((i) => i.labels![category] === "policy").length,
    labelled.filter((i) => i.nearMiss?.includes(category)).length,
  ]),
  [
    "(acceptable)",
    "",
    "",
    labelled.filter((i) => Object.keys(i.labels!).length === 0).length,
  ],
]);

const langs = [...new Set(items.map((item) => item.lang))].sort();
table([
  ["lang", "items", "unlabelled", "unreviewed", "reviewed"],
  ...langs.map((lang) => {
    const of = items.filter((item) => item.lang === lang);
    return [
      lang,
      of.length,
      of.filter((i) => i.labels === undefined).length,
      of.filter((i) => i.labels !== undefined && !i.reviewedBy).length,
      of.filter((i) => i.reviewedBy).length,
    ];
  }),
]);

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}
console.log(`${items.length} items, all valid`);
