import { describe, expect, it } from "vitest";

import type { ResponseRecord } from "cip-179/domain";
import type { JsonSafe } from "cip-179/tally";

import { parseHideTarget, publishHides, redactResponse } from "./hiding";
import { NOTHING_HIDDEN, type SnapshotMeta } from "./store";
import { testStore } from "./testing/store";

const TX = "ab".repeat(32);

describe("parseHideTarget", () => {
  it.each([
    [`survey:${TX}:0`, { kind: "survey", key: `${TX}:0` }],
    [`response:${TX.toUpperCase()}:2`, { kind: "response", key: `${TX}:2` }],
    [
      "govAction:gov_action1qqqqzz",
      { kind: "govAction", key: "gov_action1qqqqzz" },
    ],
    [
      `https://tessera.cardano.org/survey/${TX}%3A1`,
      { kind: "survey", key: `${TX}:1` },
    ],
    [
      `https://tessera.cardano.org/survey/${TX}:1/respond?x=1`,
      { kind: "survey", key: `${TX}:1` },
    ],
    [
      `https://tessera.cardano.org/survey/${TX}%3A1#response=${TX}:3`,
      { kind: "response", key: `${TX}:3` },
    ],
  ])("reads %s", (input, target) => {
    expect(parseHideTarget(input)).toEqual(target);
  });

  it.each([
    `${TX}:0`,
    `survey:${TX}:01`,
    `survey:${TX}`,
    `cancellation:${TX}:0`,
    "govAction:gov_action1bio",
    "https://tessera.cardano.org/create",
    `https://tessera.cardano.org/survey/${TX}%3A1#response=nope`,
    "not a url://",
  ])("refuses %s", (input) => {
    expect(parseHideTarget(input)).toBeNull();
  });
});

describe("redactResponse", () => {
  const record = (
    answers: JsonSafe<ResponseRecord>["response"]["answers"],
  ): JsonSafe<ResponseRecord> =>
    ({
      txHash: TX,
      slot: 1,
      epochNo: 1,
      responseIndex: 0,
      response: {
        specVersion: 5,
        surveyRef: { txId: { $bytes: TX }, index: 0 },
        role: 0,
        credential: { type: "key", keyHash: { $bytes: "11" } },
        answers,
        rationale: { uri: "https://example.com", hash: { $bytes: "00" } },
      },
    }) as JsonSafe<ResponseRecord>;

  it("drops a sealed response's ciphertext and the rationale", () => {
    const redacted = redactResponse(
      record({ type: "sealed", ciphertext: { $bytes: "beef" } }),
    );
    expect(redacted.response.answers).toEqual({
      type: "sealed",
      ciphertext: { $bytes: "" },
    });
    expect("rationale" in redacted.response).toBe(false);
    expect(redacted.response.credential).toEqual({
      type: "key",
      keyHash: { $bytes: "11" },
    });
  });
});

describe("publishHides", () => {
  const meta = (hideSeq: number, hidden = NOTHING_HIDDEN): SnapshotMeta => ({
    tip: "{}",
    incomplete: false,
    fetchedAt: 1,
    listCounts: null,
    settling: null,
    hidden: JSON.stringify(hidden),
    hideSeq,
  });

  it("republishes the previous state after one read while the log is unchanged", async () => {
    const store = testStore();
    await store.appendHideDecision({
      kind: "survey",
      key: `${TX}:0`,
      action: "hide",
      caseId: "c",
      at: 1,
    });
    const previous = meta(1, { ...NOTHING_HIDDEN, survey: [`${TX}:0`] });
    const trips = store.roundTrips();
    const hides = await publishHides(store, previous, 2);
    expect(store.roundTrips() - trips).toBe(1);
    expect(hides).toEqual({
      state: { ...NOTHING_HIDDEN, survey: [`${TX}:0`] },
      hidden: previous.hidden,
      hideSeq: 1,
      changed: false,
    });
  });

  it("follows the latest decision per key", async () => {
    const store = testStore();
    const decide = (key: string, action: "hide" | "unhide") =>
      store.appendHideDecision({
        kind: "response",
        key,
        action,
        caseId: "c",
        at: 1,
      });
    await decide(`${TX}:0`, "hide");
    await decide(`${TX}:1`, "hide");
    await decide(`${TX}:0`, "unhide");
    const hides = await publishHides(store, meta(0), 2);
    expect(hides.state.response).toEqual([`${TX}:1`]);
    expect(hides.hideSeq).toBe(3);
    expect(hides.changed).toBe(true);
    // Published, it is quiet until the next decision.
    expect((await publishHides(store, meta(3, hides.state), 3)).changed).toBe(
      false,
    );
  });
});
