/**
 * Writes every survey and response with free text from one backend to
 * `data/onchain-<network>.jsonl`. Labels already in that file are kept by id,
 * so exporting again only adds what is new.
 *
 *   pnpm --filter tessera-moderation-eval export <backend URL> <network>
 *
 * An item whose text repeats an earlier one, or one in another data file, is
 * left out: test networks carry the same answer dozens of times, and the same
 * survey is often published on several networks, which would weigh on every
 * metric. A survey
 * the backend hides is not served, so it is not exported.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  createTesseraClient,
  NETWORKS,
  SurveyUnavailableError,
  type Network,
} from "cardano-tessera-client";
import { DATA_DIR, dataFiles, readLines, writeItems } from "./data.js";
import { responseFields, surveyFields } from "./fields.js";
import type { Fields, Item } from "./item.js";

const [baseUrl, network] = process.argv.slice(2);
if (!baseUrl || !NETWORKS.includes(network as Network)) {
  console.error(`usage: export <backend URL> <${NETWORKS.join("|")}>`);
  process.exit(2);
}

const client = createTesseraClient({ baseUrl, network: network as Network });
const file = join(DATA_DIR, `onchain-${network}.jsonl`);
const previous = new Map(
  (existsSync(file) ? readLines(file) : []).map(({ value }) => {
    const item = value as Item;
    return [item.id, item];
  }),
);

const items: Item[] = [];
const texts = new Set(
  dataFiles()
    .filter((other) => other !== file)
    .flatMap((other) =>
      readLines(other).map(({ value }) =>
        JSON.stringify((value as Item).fields),
      ),
    ),
);
const add = (id: string, kind: Item["kind"], fields: Fields) => {
  const text = JSON.stringify(fields);
  if (texts.has(text)) return;
  texts.add(text);
  const { fields: _old, ...kept } = previous.get(id) ?? {
    source: "onchain",
    network,
    kind,
    lang: "und",
  };
  items.push({ id, ...kept, fields } as Item);
};

let cursor: string | undefined;
do {
  const page = await client.surveys({ limit: 200, cursor });
  if (!page.ready) throw new Error("the backend has no snapshot yet");
  for (const record of page.body.surveys) {
    const key = `${record.txHash}:${record.ref.index}`;
    add(
      `onchain:${network}:survey:${key}`,
      "survey",
      surveyFields(record.definition),
    );
    let bundle;
    try {
      bundle = await client.wholeBundle(key);
    } catch (error) {
      if (error instanceof SurveyUnavailableError) continue;
      throw error;
    }
    if (!bundle.ready) throw new Error("the backend has no snapshot yet");
    for (const r of bundle.body.responses) {
      const fields = responseFields(r.response, record.definition);
      if (Object.keys(fields).length === 0) continue;
      add(
        `onchain:${network}:response:${r.txHash}:${r.responseIndex}`,
        "response",
        fields,
      );
    }
  }
  cursor = page.body.nextCursor ?? undefined;
} while (cursor);

writeItems(file, items);
const fresh = items.filter((item) => !previous.has(item.id)).length;
console.log(`${items.length} items (${fresh} new) → ${file}`);
