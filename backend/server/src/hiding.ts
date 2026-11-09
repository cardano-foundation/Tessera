/**
 * Hiding content (ARCHITECTURE.md §11): what this website stops showing once a
 * report is judged unlawful. Nothing leaves the chain, and nothing a result is
 * computed from changes — finalization reads the stored rows, never what is
 * served — so a hide is a serving-tier redaction and nothing else.
 *
 * Decisions are appended to `hide_log` by the `hide` script; a refresh
 * publishes the resulting state with its snapshot ({@link publishHides}), and
 * the routes read only that published state, so a hide moves with
 * `fetchedAt`, the ETags and the change selection.
 */

import type { GovLink, ResponseRecord } from "cip-179/domain";
import type { JsonSafe } from "cip-179/tally";
import { SURVEY_KEY_RE } from "cardano-tessera-client";

import type { HideKind, HideStore, Hidden, SnapshotMeta } from "./store";
import { NOTHING_HIDDEN, snapshotHidden } from "./store";

/** What the refresh publishes with its envelope. */
export interface PublishedHides {
  readonly state: Hidden;
  /** Wire JSON of {@link state}, for `SnapshotMeta.hidden`. */
  readonly hidden: string;
  readonly hideSeq: number;
  /** Whether the state differs from the previous envelope's. */
  readonly changed: boolean;
}

const minus = (a: readonly string[], b: readonly string[]): string[] => {
  const drop = new Set(b);
  return a.filter((k) => !drop.has(k));
};

/**
 * The hide state to publish under `generation`. A refresh that finds the log
 * where the previous envelope read it republishes that state after one
 * single-row read; otherwise it reads the state, which costs what the log
 * holds, and stamps what changed for the change selection.
 */
export async function publishHides(
  store: HideStore,
  previous: SnapshotMeta | null,
  generation: number,
): Promise<PublishedHides> {
  const seq = await store.hideLogSeq();
  if (previous !== null && seq === previous.hideSeq)
    return {
      state: snapshotHidden(previous),
      hidden: previous.hidden,
      hideSeq: seq,
      changed: false,
    };
  const now = await store.hideState();
  const before = previous ? snapshotHidden(previous) : NOTHING_HIDDEN;
  await store.stampHideChange(generation, {
    hiddenSurveys: minus(now.hidden.survey, before.survey),
    shownSurveys: minus(before.survey, now.hidden.survey),
    govActions: [
      ...minus(now.hidden.govAction, before.govAction),
      ...minus(before.govAction, now.hidden.govAction),
    ],
  });
  const hidden = JSON.stringify(now.hidden);
  return {
    state: now.hidden,
    hidden,
    hideSeq: now.seq,
    changed: hidden !== (previous?.hidden ?? JSON.stringify(NOTHING_HIDDEN)),
  };
}

/**
 * A hidden response as served: its non-custom answers stay, so the live view
 * still counts the choices it made, and everything that can carry text goes —
 * the custom answer values, the rationale anchor, and a sealed ciphertext,
 * which the browser would decrypt itself.
 */
export function redactResponse(
  record: JsonSafe<ResponseRecord>,
): JsonSafe<ResponseRecord> {
  const { rationale: _rationale, ...response } = record.response;
  const answers: JsonSafe<ResponseRecord>["response"]["answers"] =
    response.answers.type === "public"
      ? {
          type: "public",
          answers: response.answers.answers.filter((a) => a.type !== "custom"),
        }
      : { type: "sealed", ciphertext: { $bytes: "" } };
  return { ...record, response: { ...response, answers } };
}

/** Links as served: a hidden action's title is withheld. */
export function redactGovLinks(
  links: readonly GovLink[],
  hiddenActions: readonly string[],
): GovLink[] {
  if (hiddenActions.length === 0) return [...links];
  const hidden = new Set(hiddenActions);
  return links.map((link) =>
    link.title !== null && hidden.has(link.actionId)
      ? { ...link, title: null }
      : link,
  );
}

/** What a keyed read returns, less the hidden keys. */
export function withoutHidden<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  hiddenKeys: readonly string[],
): T[] {
  if (hiddenKeys.length === 0) return [...items];
  const hidden = new Set(hiddenKeys);
  return items.filter((item) => !hidden.has(keyOf(item)));
}

/** A decision's target. */
export interface HideTarget {
  readonly kind: HideKind;
  readonly key: string;
}

const GOV_ACTION_RE = /^gov_action1[02-9ac-hj-np-z]+$/;

const targetOf = (kind: string, key: string): HideTarget | null => {
  switch (kind) {
    case "survey":
    case "response":
      return SURVEY_KEY_RE.test(key) ? { kind, key } : null;
    case "govAction":
      return GOV_ACTION_RE.test(key) ? { kind, key } : null;
    default:
      return null;
  }
};

/**
 * The target a report names: a key in `<kind>:<key>` form, or the page URL a
 * report carries — a survey page (`/survey/<key>`, any screen under it), with
 * a `#response=<txHash>:<index>` fragment when it names one of its responses.
 * Null when it names nothing. Keys are lowercased, as stored.
 */
export function parseHideTarget(input: string): HideTarget | null {
  const raw = input.trim();
  if (/^[a-z]+:\/\//i.test(raw)) {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return null;
    }
    const fragment = /^#response=(.+)$/.exec(url.hash);
    if (fragment) return targetOf("response", fragment[1]!.toLowerCase());
    const page = /^\/survey\/([^/]+)/.exec(url.pathname);
    if (!page) return null;
    let key: string;
    try {
      key = decodeURIComponent(page[1]!);
    } catch {
      return null;
    }
    return targetOf("survey", key.toLowerCase());
  }
  const colon = raw.indexOf(":");
  if (colon < 0) return null;
  const kind = raw.slice(0, colon);
  return targetOf(kind, raw.slice(colon + 1).toLowerCase());
}
