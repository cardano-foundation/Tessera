/**
 * Scores the labelled items with one provider, appending each verdict to its
 * run file. An item already scored on the same text is skipped, so an
 * interrupted or rate-limited run continues where it stopped; a failed call
 * is kept as an error line and tried again next time.
 *
 *   pnpm --filter tessera-moderation-eval score <provider> [lang…]
 */
import { existsSync } from "node:fs";
import { loadSet } from "./data.js";
import { renderFields } from "./fields.js";
import type { Provider } from "./provider.js";
import { baseline } from "./providers/baseline.js";
import { jev } from "./providers/jev.js";
import {
  appendLine,
  latest,
  readRun,
  runFile,
  textHash,
  type RunMeta,
} from "./run.js";

const PROVIDERS: Record<string, () => Provider> = { baseline, jev };

const [name, ...langs] = process.argv.slice(2);
const make = name ? PROVIDERS[name] : undefined;
if (!make) {
  console.error(`usage: score <${Object.keys(PROVIDERS).join("|")}> [lang…]`);
  process.exit(2);
}
const provider = make();

const { items, problems } = loadSet();
if (problems.length > 0) {
  console.error(`${problems.length} problems in the set; run check first`);
  process.exit(1);
}

const file = runFile(provider);
const meta: RunMeta = {
  provider: provider.name,
  model: provider.model,
  covers: provider.covers,
};
const done = new Map<string, string>();
if (existsSync(file)) {
  const run = readRun(file);
  if (JSON.stringify(run.meta) !== JSON.stringify(meta)) {
    console.error(`${file} was made with other settings; move it away first`);
    process.exit(1);
  }
  for (const line of latest(run.lines).values())
    if (line.error === undefined) done.set(line.id, line.hash);
} else {
  appendLine(file, meta);
}

const chosen = items.filter(
  (item) =>
    item.labels !== undefined &&
    (langs.length === 0 || langs.includes(item.lang)),
);
let scored = 0;
let failed = 0;
for (const item of chosen) {
  const text = renderFields(item.fields);
  const hash = textHash(text);
  if (done.get(item.id) === hash) continue;
  const start = performance.now();
  try {
    const verdict = await provider.classify(text);
    const ms = Math.round(performance.now() - start);
    appendLine(file, { id: item.id, hash, ms, ...verdict });
  } catch (error) {
    const ms = Math.round(performance.now() - start);
    appendLine(file, {
      id: item.id,
      hash,
      scores: {},
      ms,
      error: (error as Error).message,
    });
    failed++;
  }
  scored++;
  if (scored % 25 === 0) console.error(`${scored} scored…`);
}
console.log(
  `${scored} scored (${failed} failed), ${chosen.length - scored} already done → ${file}`,
);
