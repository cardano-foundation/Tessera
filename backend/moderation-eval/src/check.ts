/**
 * Validates every data file and prints the set's coverage: positives per
 * category and severity, near misses, and items per language by review state.
 * Exits non-zero on any problem `loadSet` finds.
 *
 *   pnpm --filter tessera-moderation-eval check
 */
import { loadSet } from "./data.js";
import { CATEGORIES } from "./item.js";

const { items, problems } = loadSet();

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
