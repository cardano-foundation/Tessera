/**
 * Compares two runs on the items both scored on their current text: rates
 * and Brier score side by side, then every item whose grade changed at the
 * threshold. Ids, labels and scores only, never item text.
 *
 *   pnpm --filter tessera-moderation-eval compare <run A> <run B> [--subset <name>] [--at 0.5]
 */
import { options } from "./args.js";
import { loadSet, readSubset } from "./data.js";
import type { Category } from "./item.js";
import {
  brier,
  casesOf,
  grade,
  rates,
  top,
  type Case,
  type Share,
} from "./metrics.js";
import { latest, readRun } from "./run.js";

const o = options(process.argv.slice(2));
const at = o.number("--at", 0.5);
const subsetName = o.string("--subset");
const [fileA, fileB] = o.args;
if (!fileA || !fileB || !(at > 0 && at <= 1)) {
  console.error("usage: compare <run A> <run B> [--subset <name>] [--at 0.5]");
  process.exit(2);
}

const subset = subsetName ? readSubset(subsetName) : undefined;
const items = loadSet().items.filter(
  (i) => subset === undefined || subset.has(i.id),
);
const runs = [fileA, fileB].map((file) => {
  const { meta, lines } = readRun(file);
  const { cases } = casesOf(items, latest(lines));
  return { name: `${meta.provider} ${meta.model}`, cases };
});
const [a, b] = runs as [(typeof runs)[0], (typeof runs)[0]];
const inB = new Map(b.cases.map((c) => [c.item.id, c]));
const pairs = a.cases.flatMap((c) => {
  const other = inB.get(c.item.id);
  return other ? [[c, other] as const] : [];
});
const casesA = pairs.map(([c]) => c);
const casesB = pairs.map(([, c]) => c);

const pct = ({ k, n }: Share) =>
  n === 0 ? "–" : `${k}/${n} (${((100 * k) / n).toFixed(1)}%)`;
const table = (head: string[], rows: string[][]) =>
  [head, head.map(() => "---"), ...rows]
    .map((r) => `| ${r.join(" | ")} |`)
    .join("\n");
const row = (name: string, cases: readonly Case[]) => {
  const r = rates(cases, at);
  return [
    name,
    pct(r.unlawful),
    pct(r.policy),
    pct(r.acceptable),
    pct(r.nearMiss),
    brier(cases).toFixed(4),
  ];
};

const out: string[] = [
  `# ${a.name} → ${b.name}${subsetName ? `, subset ${subsetName}` : ""}`,
  `${pairs.length} items scored by both; at ${at}.`,
  table(
    [
      "run",
      "unlawful caught",
      "policy caught",
      "acceptable flagged",
      "near misses flagged",
      "Brier",
    ],
    [row(a.name, casesA), row(b.name, casesB)],
  ),
];

const GRADES = ["wrong", "other category", "right"];
const labelled = (c: Case, scores: Case["scores"]) =>
  Object.keys(c.item.labels)
    .map((k) => `${k} ${(scores[k as Category] ?? 0).toFixed(2)}`)
    .join(", ");
const changed = pairs
  .map(([x, y]) => ({ x, y, from: grade(x, at), to: grade(y, at) }))
  .filter(({ from, to }) => from !== to)
  .sort((p, q) => q.to - q.from - (p.to - p.from));
const better = changed.filter(({ from, to }) => to > from).length;
out.push(
  `## Grade changes: ${better} better, ${changed.length - better} worse`,
  table(
    ["id", "labels", "top", "own score", "grade"],
    changed.map(({ x, y, from, to }) => [
      x.item.id,
      Object.entries(x.item.labels)
        .map(([k, s]) => `${k} ${s}`)
        .join(", ") ||
        `acceptable${x.item.nearMiss ? ` (near ${x.item.nearMiss.join(", ")})` : ""}`,
      `${top(x).toFixed(2)} → ${top(y).toFixed(2)}`,
      Object.keys(x.item.labels).length > 0
        ? `${labelled(x, x.scores)} → ${labelled(x, y.scores)}`
        : "",
      `${GRADES[from]} → ${GRADES[to]}`,
    ]),
  ),
);
console.log(out.join("\n\n"));
