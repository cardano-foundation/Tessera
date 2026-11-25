/**
 * Prints a run's error rates as Markdown: operating thresholds for hiding
 * (unlawful items) and queueing (policy items), a threshold sweep, and, at one
 * reading threshold, rates per category, language, tag and review status, and
 * translation consistency. Aggregates only, never item text.
 *
 *   pnpm --filter tessera-moderation-eval report <run file> [--target 0.95] [--at 0.5]
 */
import { loadSet } from "./data.js";
import { CATEGORIES } from "./item.js";
import {
  casesOf,
  categoryRates,
  consistency,
  quantile,
  rates,
  split,
  threshold,
  type Rates,
  type Share,
} from "./metrics.js";
import { latest, readRun } from "./run.js";

const args = process.argv.slice(2);
const option = (flag: string, fallback: number) => {
  const i = args.indexOf(flag);
  if (i === -1) return fallback;
  const [value] = args.splice(i, 2).slice(1);
  return Number(value);
};
const target = option("--target", 0.95);
const at = option("--at", 0.5);
const [file] = args;
if (!file || !(target > 0 && target <= 1) || !(at > 0 && at <= 1)) {
  console.error("usage: report <run file> [--target 0.95] [--at 0.5]");
  process.exit(2);
}

const { meta, lines } = readRun(file);
const byId = latest(lines);
const { items } = loadSet();
const { cases, unscored, failed } = casesOf(items, byId);

const pct = ({ k, n }: Share) =>
  n === 0 ? "–" : `${k}/${n} (${((100 * k) / n).toFixed(1)}%)`;
const num = (t: number | undefined) => (t === undefined ? "–" : t.toFixed(3));
const table = (head: string[], rows: string[][]) =>
  [head, head.map(() => "---"), ...rows]
    .map((r) => `| ${r.join(" | ")} |`)
    .join("\n");
const rateCells = (r: Rates) => [
  pct(r.unlawful),
  pct(r.policy),
  pct(r.acceptable),
  pct(r.nearMiss),
];
const ratesAt = (t: number | undefined) =>
  t === undefined ? ["–", "–", "–", "–"] : rateCells(rates(cases, t));
const RATE_HEAD = [
  "unlawful caught",
  "policy caught",
  "acceptable flagged",
  "near misses flagged",
];

const out: string[] = [];
const uncovered = CATEGORIES.filter((c) => !meta.covers.includes(c));
out.push(
  `# ${meta.provider} ${meta.model}`,
  `${cases.length} items scored, ${unscored} not scored on their current text, ${failed} failed. ` +
    `Not covered: ${uncovered.length > 0 ? uncovered.join(", ") : "none"}.`,
);

const hide = threshold(cases, "unlawful", target);
const queue = threshold(cases, "policy", target);
out.push(
  `## Operating thresholds (${target * 100}% caught)`,
  "The highest threshold on an item's top score that still catches the target share. " +
    "An uncovered category's items count as items to catch.",
  table(
    ["action", "threshold", ...RATE_HEAD],
    [
      ["hide (unlawful)", num(hide), ...ratesAt(hide)],
      ["queue (policy)", num(queue), ...ratesAt(queue)],
    ],
  ),
);

const SWEEP = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99];
out.push(
  "## Sweep",
  table(
    ["threshold", ...RATE_HEAD],
    SWEEP.map((t) => [String(t), ...rateCells(rates(cases, t))]),
  ),
);

out.push(
  `## Per category at ${at}`,
  "Each category's own score; false flags among items with no label.",
  table(
    ["category", ...RATE_HEAD],
    CATEGORIES.map((c) =>
      meta.covers.includes(c)
        ? [c, ...rateCells(categoryRates(cases, c, at))]
        : [c, "not covered", "", "", ""],
    ),
  ),
);

const splitTable = (title: string, groups: Parameters<typeof split>[1]) =>
  out.push(
    `## By ${title} at ${at}`,
    table(
      [title, ...RATE_HEAD],
      split(cases, groups, at).map(([g, r]) => [g, ...rateCells(r)]),
    ),
  );
splitTable("language", (c) => [c.item.lang]);
splitTable("tag", (c) => c.item.tags ?? ["(none)"]);
splitTable("review", (c) => [c.item.reviewedBy ? "reviewed" : "author only"]);

out.push(
  `## Translations flagged as their original at ${at}`,
  table(
    ["language", "same decision"],
    consistency(cases, at).map(([lang, s]) => [lang, pct(s)]),
  ),
);

const ok = [...byId.values()].filter((l) => l.error === undefined);
const costs = ok.flatMap((l) => (l.cost === undefined ? [] : [l.cost]));
out.push(
  "## Latency and cost",
  table(
    ["p50 ms", "p95 ms", "cost per 1,000 items"],
    [
      [
        String(
          quantile(
            ok.map((l) => l.ms),
            0.5,
          ),
        ),
        String(
          quantile(
            ok.map((l) => l.ms),
            0.95,
          ),
        ),
        costs.length === ok.length && ok.length > 0
          ? `$${((1000 * costs.reduce((a, b) => a + b, 0)) / ok.length).toFixed(2)}`
          : "–",
      ],
    ],
  ),
);

console.log(out.join("\n\n"));
