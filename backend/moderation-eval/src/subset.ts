/**
 * Writes the tuning half's items near the decision in one run to a named
 * subset, so a provider's next version can be scored on those first: items
 * far from the threshold rarely move. The held-out half stays out of every
 * subset, to check the tuned version on once.
 *
 *   pnpm --filter tessera-moderation-eval subset <run file> <name> [--low 0.2] [--high 0.8] [--at 0.5]
 */
import { options } from "./args.js";
import { loadSet, writeSubset } from "./data.js";
import { boundary, casesOf, halves, severity } from "./metrics.js";
import { latest, readRun } from "./run.js";

const o = options(process.argv.slice(2));
const low = o.number("--low", 0.2);
const high = o.number("--high", 0.8);
const at = o.number("--at", 0.5);
const [file, name] = o.args;
if (!file || !name || !(0 <= low && low < high && high <= 1)) {
  console.error(
    "usage: subset <run file> <name> [--low 0.2] [--high 0.8] [--at 0.5]",
  );
  process.exit(2);
}

const { items } = loadSet();
const half = halves(items);
const { cases } = casesOf(items, latest(readRun(file).lines));
const tune = cases.filter((c) => half(c.item) === "tune");
const chosen = boundary(tune, low, high, at);
const count = (of: string) => chosen.filter((c) => severity(c) === of).length;
const path = writeSubset(
  name,
  chosen.map((c) => c.item.id),
);
console.log(
  `${chosen.length} of ${tune.length} tuning items (${cases.length} scored): ` +
    `${count("unlawful")} unlawful, ${count("policy")} policy, ${count("acceptable")} acceptable → ${path}`,
);
