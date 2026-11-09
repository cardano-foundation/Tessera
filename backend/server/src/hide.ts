/**
 * Record a moderation decision (ARCHITECTURE.md §11):
 *
 *   hide <hide|unhide> <page URL or key> --case <id>
 *   hide list
 *
 * The target is the page URL a report carries, or `survey:<txHash>:<index>`,
 * `response:<txHash>:<index>` or `govAction:<gov_action1…>`. The decision takes
 * effect at the next refresh. Nothing printed names the target: the script runs
 * in a public repository's workflow, whose logs anyone can read.
 *
 * It writes to the Turso database named by `TURSO_DATABASE_URL`, or without it
 * to the local SQLite file of `NETWORK`. Read from the environment alone, never
 * from `.env`: a Turso URL left there would aim a local run at a deployment.
 */

import { parseArgs } from "node:util";

import { loadConfig } from "./config";
import { parseHideTarget, type HideTarget } from "./hiding";
import type { BackendStore } from "./store";
import { libsqlBackendStore, tursoClient } from "./store-libsql";
import { openBackendStore } from "./store-node";

const USAGE = `usage: hide <hide|unhide> <page URL or key> --case <id>
       hide list`;

const NOUN: Record<HideTarget["kind"], string> = {
  survey: "survey",
  response: "response",
  govAction: "governance action title",
};

/** Whether the target names a row this database holds; actions are not stored. */
async function isStored(
  store: BackendStore,
  { kind, key }: HideTarget,
): Promise<boolean> {
  switch (kind) {
    case "survey":
      return (await store.surveyRowsByKeys([key])).length > 0;
    case "response": {
      const [txHash, index] = key.split(":");
      return (await store.responsesByTx(txHash!)).some(
        (r) => r.responseIndex === Number(index),
      );
    }
    case "govAction":
      return true;
  }
}

async function run(store: BackendStore, args: string[]): Promise<string> {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: { case: { type: "string" } },
  });
  const [command, input] = positionals;

  if (command === "list" && positionals.length === 1) {
    const log = await store.hideLog();
    if (log.length === 0) return "No decisions recorded.";
    return log
      .map(
        (d) =>
          `${String(d.seq).padStart(4)}  ${new Date(d.at * 1000).toISOString()}  ` +
          `${d.action.padEnd(6)}  ${NOUN[d.kind]}  case ${d.caseId}`,
      )
      .join("\n");
  }

  if (
    (command !== "hide" && command !== "unhide") ||
    input === undefined ||
    positionals.length !== 2
  )
    throw new Error(USAGE);
  const caseId = values.case?.trim();
  if (!caseId) throw new Error(`--case is required\n${USAGE}`);
  const target = parseHideTarget(input);
  if (!target)
    throw new Error("the target names no survey, response or action");

  const hidden = (await store.hideState()).hidden[target.kind].includes(
    target.key,
  );
  if (command === "hide" && hidden)
    return `That ${NOUN[target.kind]} is already hidden. Nothing recorded.`;
  if (command === "unhide" && !hidden)
    return `That ${NOUN[target.kind]} is not hidden. Nothing recorded.`;
  // A target this network never indexed is most likely a report from another
  // network's website, run against the wrong database.
  if (command === "hide" && !(await isStored(store, target)))
    throw new Error(
      `no such ${NOUN[target.kind]} on this network: check the network input`,
    );

  await store.appendHideDecision({
    kind: target.kind,
    key: target.key,
    action: command,
    caseId,
    at: Math.floor(Date.now() / 1000),
  });
  return (
    `Recorded: ${command} a ${NOUN[target.kind]} (case ${caseId}). ` +
    `It takes effect at the next refresh, within a few minutes.`
  );
}

const store = process.env["TURSO_DATABASE_URL"]
  ? libsqlBackendStore(tursoClient(process.env))
  : openBackendStore(loadConfig(process.env).dbPath);
try {
  console.log(await run(store, process.argv.slice(2)));
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
} finally {
  store.close();
}
