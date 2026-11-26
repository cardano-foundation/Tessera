/**
 * Prints a run's error rates as Markdown: operating thresholds for hiding
 * (unlawful items) and queueing (policy items), a threshold sweep, and, at one
 * reading threshold, rates per category, language, tag and review status, and
 * translation consistency. Aggregates only, never item text.
 *
 * With `--mistakes`, the report also lists every item wrong at that threshold,
 * with its text, so it goes to a file under the git-ignored data folder
 * instead of the terminal.
 *
 * With `--subset`, it reads only the items of that subset.
 *
 *   pnpm --filter tessera-moderation-eval report <run file> [--target 0.95] [--at 0.5] [--subset <name>] [--mistakes]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { options } from "./args.js";
import { DATA_DIR, loadSet, readSubset } from "./data.js";
import { renderFields } from "./fields.js";
import { CATEGORIES, type Category } from "./item.js";
import {
  casesOf,
  categoryRates,
  consistency,
  halves,
  mistakes,
  quantile,
  rates,
  severity,
  split,
  threshold,
  top,
  type Case,
  type Rates,
  type Share,
} from "./metrics.js";
import { latest, readRun } from "./run.js";

const o = options(process.argv.slice(2));
const target = o.number("--target", 0.95);
const at = o.number("--at", 0.5);
const subsetName = o.string("--subset");
const withMistakes = o.flag("--mistakes");
const [file] = o.args;
if (!file || !(target > 0 && target <= 1) || !(at > 0 && at <= 1)) {
  console.error(
    "usage: report <run file> [--target 0.95] [--at 0.5] [--subset <name>] [--mistakes]",
  );
  process.exit(2);
}

const { meta, lines } = readRun(file);
const byId = latest(lines);
const subset = subsetName ? readSubset(subsetName) : undefined;
const all = loadSet().items;
const half = halves(all);
const items = all.filter((i) => subset === undefined || subset.has(i.id));
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
  `# ${meta.provider} ${meta.model}${subsetName ? `, subset ${subsetName}` : ""}`,
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
splitTable("half", (c) => [half(c.item)]);

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

if (!withMistakes) {
  console.log(out.join("\n\n"));
  process.exit(0);
}

/** A code fence longer than any backtick run in the text. */
const fenced = (text: string) => {
  const longest = Math.max(
    2,
    ...[...text.matchAll(/`+/g)].map((m) => m[0].length),
  );
  const fence = "`".repeat(longest + 1);
  return `${fence}text\n${text}\n${fence}`;
};

const describe = (c: Case) => {
  const { item } = c;
  const labels = Object.entries(item.labels).map(([k, s]) => `${k} ${s}`);
  const scores = Object.entries(c.scores)
    .filter(([, p]) => p >= 0.05)
    .sort(([, a], [, b]) => b - a)
    .map(([k, p]) => `${k} ${p.toFixed(2)}`);
  return [
    `#### ${item.id}`,
    [
      `${item.source}${item.network ? ` ${item.network}` : ""} ${item.kind}, ${item.lang}`,
      ...(item.tags ? [`tags: ${item.tags.join(", ")}`] : []),
      item.reviewedBy ? `reviewed by ${item.reviewedBy}` : "author only",
    ].join("; "),
    `Labels: ${labels.length > 0 ? labels.join(", ") : "acceptable"}` +
      (item.nearMiss ? `; near miss: ${item.nearMiss.join(", ")}` : ""),
    `Scores: ${scores.length > 0 ? scores.join(", ") : "all below 0.05"}`,
    ...(item.note ? [`Note: ${item.note}`] : []),
    fenced(renderFields(item.fields)),
  ].join("\n\n");
};

const ORDER = { unlawful: 0, policy: 1, acceptable: 2 };
const section = (
  title: string,
  of: readonly Case[],
  group: (c: Case) => Category,
  order: (a: Case, b: Case) => number,
) => {
  out.push(`## ${title} at ${at} (${of.length})`);
  for (const category of CATEGORIES) {
    const inGroup = of.filter((c) => group(c) === category).sort(order);
    if (inGroup.length === 0) continue;
    out.push(`### ${category} (${inGroup.length})`, ...inGroup.map(describe));
  }
};
const firstLabel = (c: Case, below = false) =>
  CATEGORIES.find(
    (k) => k in c.item.labels && (!below || (c.scores[k] ?? 0) < at),
  )!;
const bySeverityThenScore = (a: Case, b: Case) =>
  ORDER[severity(a)] - ORDER[severity(b)] || top(a) - top(b);

const m = mistakes(cases, at);
out.push(
  "# Mistakes",
  "Missed: harmful items whose top score stays below the threshold, by their first label. " +
    "Flagged under another category: harmful items flagged, by the first label whose own score is below it. " +
    "False flags: acceptable items flagged, by their top category.",
);
section("Missed", m.missed, (c) => firstLabel(c), bySeverityThenScore);
section(
  "Flagged under another category",
  m.misfiled,
  (c) => firstLabel(c, true),
  bySeverityThenScore,
);
section(
  "False flags",
  m.falseFlags,
  (c) =>
    CATEGORIES.reduce((best, k) =>
      (c.scores[k] ?? 0) > (c.scores[best] ?? 0) ? k : best,
    ),
  (a, b) => top(b) - top(a),
);

const path = join(
  DATA_DIR,
  "reports",
  `${basename(file, ".jsonl")}${subsetName ? `-${subsetName}` : ""}.md`,
);
mkdirSync(join(DATA_DIR, "reports"), { recursive: true });
writeFileSync(path, out.join("\n\n") + "\n");
console.log(
  `${m.missed.length} missed, ${m.misfiled.length} under another category, ` +
    `${m.falseFlags.length} false flags at ${at} → ${path}`,
);
