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
 * metric. A survey the backend hides is not served, so it is not exported.
 *
 * An external-content survey keeps its text in its content-anchor document,
 * so the document is fetched, hash-verified and applied before the survey and
 * its responses are rendered. A survey whose document no source returns keeps
 * its on-chain text only, and is listed.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { applyPresentation, parsePresentation } from "cardano-tessera-core";
import {
  createTesseraClient,
  NETWORKS,
  SurveyUnavailableError,
  type Network,
} from "cardano-tessera-client";
import type { SurveyDefinition } from "cip-179";
import { fetchAnchorJson } from "cip-179/content";
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
const changed: string[] = [];
const unfetched: string[] = [];
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
  const old = previous.get(id);
  if (old && JSON.stringify(old.fields) !== text) changed.push(id);
  const { fields: _old, ...kept } = old ?? {
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
    const definition = await withPresentation(key, record.definition);
    add(`onchain:${network}:survey:${key}`, "survey", surveyFields(definition));
    let bundle;
    try {
      bundle = await client.wholeBundle(key);
    } catch (error) {
      if (error instanceof SurveyUnavailableError) continue;
      throw error;
    }
    if (!bundle.ready) throw new Error("the backend has no snapshot yet");
    for (const r of bundle.body.responses) {
      const fields = responseFields(r.response, definition);
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
if (changed.length > 0)
  console.log(
    `Text changed, so its labels and review need a new look:\n  ${changed.join("\n  ")}`,
  );
if (unfetched.length > 0)
  console.log(
    `No content-anchor document fetched, on-chain text only:\n  ${unfetched.join("\n  ")}`,
  );

async function withPresentation(
  key: string,
  definition: SurveyDefinition,
): Promise<SurveyDefinition> {
  if (!definition.contentAnchor) return definition;
  try {
    const document = await fetchAnchorJson(definition.contentAnchor);
    return applyPresentation(definition, parsePresentation(document));
  } catch (error) {
    unfetched.push(`${key}: ${(error as Error).message}`);
    return definition;
  }
}
