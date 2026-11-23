/**
 * The review round trip.
 *
 *   review export <lang> [all]       → data/review-<lang>.md, unreviewed items only unless `all`
 *   review import <sheet> <reviewer> → reviews of blocks marked `reviewed: yes` into data/reviews.jsonl
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR, loadSet, writeReviews } from "./data.js";
import { formatSheet, parseSheet } from "./sheet.js";

const [command, a, b] = process.argv.slice(2);
if (command === "export" && a) {
  const { items, problems } = loadSet();
  if (problems.length > 0) fail(problems);
  const chosen = items.filter(
    (item) => item.lang === a && (b === "all" || !item.reviewedBy),
  );
  const file = join(DATA_DIR, `review-${a}.md`);
  writeFileSync(file, formatSheet(chosen));
  console.log(`${chosen.length} items → ${file}`);
} else if (command === "import" && a && b) {
  const reviews = parseSheet(readFileSync(a, "utf8"), b);
  writeReviews(reviews);
  const { problems } = loadSet();
  if (problems.length > 0) fail(problems);
  console.log(`${reviews.length} reviews recorded`);
} else {
  console.error(
    "usage: review export <lang> [all] | review import <sheet> <reviewer>",
  );
  process.exit(2);
}

function fail(problems: readonly string[]): never {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}
