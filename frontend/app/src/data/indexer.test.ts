import { afterEach, describe, expect, it, vi } from "vitest";

import { API_VERSION } from "cardano-tessera-client";

import { IndexerDataSource } from "~/data/indexer";

const BASE = "http://localhost:8787";
const TX = "ab".repeat(32);

/** Install a fetch stub answering `/health` and one body for everything else. */
function stubFetch(status: number, body: unknown) {
  const mock = vi.fn(async (input: string | URL) => {
    const url = String(input);
    if (url.endsWith("/health"))
      return Response.json({
        ok: true,
        network: "preview",
        apiVersion: API_VERSION,
      });
    return new Response(JSON.stringify(body), { status });
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("IndexerDataSource over the client", () => {
  it("turns the client's not-ready answer into the seam's error", async () => {
    stubFetch(503, { error: "snapshot not ready" });
    const src = new IndexerDataSource(BASE, "preview");
    await expect(src.surveyList()).rejects.toThrow(/first snapshot/);
  });

  it("leaves the responses the backend withholds out of a bundle", async () => {
    const record = (txHash: string) => ({
      txHash,
      slot: 1,
      epochNo: 1,
      responseIndex: 0,
      response: {
        specVersion: 5,
        surveyRef: { txId: { $bytes: TX }, index: 0 },
        role: 0,
        credential: { type: "key", keyHash: { $bytes: "11" } },
        answers: { type: "public", answers: [] },
      },
    });
    stubFetch(200, {
      survey: {
        txHash: TX,
        slot: 1,
        epochNo: 1,
        ref: { txId: { $bytes: TX }, index: 0 },
        definition: {
          specVersion: 5,
          owner: { type: "key", keyHash: { $bytes: "11" } },
          title: "t",
          description: "",
          eligibleRoles: [0],
          endEpoch: 9,
          submissionMode: { type: "public" },
          questions: [],
        },
      },
      responses: [record("cc".repeat(32)), record("dd".repeat(32))],
      cancellations: [],
      tip: { epoch: 1, slot: 1, time: 1, epochSlot: 1, govActionLifetime: 6 },
      redactions: [`${"dd".repeat(32)}:0`],
      nextCursor: null,
    });
    const src = new IndexerDataSource(BASE, "preview");
    const bundle = await src.surveyBundle({
      txId: new Uint8Array(32).fill(0xab),
      index: 0,
    });
    expect(bundle.responses.map((r) => r.txHash)).toEqual(["cc".repeat(32)]);
    expect(bundle.redactions).toEqual([`${"dd".repeat(32)}:0`]);
  });

  it("skips the request for an empty credential set, and maps tx_status to a Map", async () => {
    const fetchMock = stubFetch(200, { [TX]: 3, ["cd".repeat(32)]: null });
    const src = new IndexerDataSource(BASE, "preview");
    expect(await src.respondedKeys([])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();

    const statuses = await src.txStatus([TX, "cd".repeat(32)]);
    expect(statuses.get(TX)).toBe(3);
    expect(statuses.get("cd".repeat(32))).toBeNull();
  });
});
