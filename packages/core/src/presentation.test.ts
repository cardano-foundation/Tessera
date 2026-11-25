import { describe, expect, it } from "vitest";
import type { Role, SurveyDefinition } from "cip-179";

import {
  PRESENTATION_KIND,
  applyPresentation,
  parsePresentation,
} from "./presentation";

const external: SurveyDefinition = {
  specVersion: 5,
  owner: { type: "key", keyHash: Uint8Array.of(0) },
  title: "",
  description: "On chain",
  eligibleRoles: [3] as Role[],
  endEpoch: 9,
  submissionMode: { type: "public" },
  questions: [
    { type: "singleChoice", prompt: "", options: { type: "count", count: 2 } },
    { type: "singleChoice", prompt: "", options: { type: "count", count: 3 } },
  ],
  contentAnchor: { uri: "ipfs://x", hash: new Uint8Array(32) },
};

describe("parsePresentation", () => {
  it("rejects a document of another kind", () => {
    expect(() => parsePresentation({ kind: "other" })).toThrow();
    expect(() => parsePresentation("text")).toThrow();
  });

  it("ignores fields of the wrong type", () => {
    expect(
      parsePresentation({
        kind: PRESENTATION_KIND,
        title: 1,
        questions: [{ prompt: "P", options: [1] }],
      }),
    ).toEqual({
      title: undefined,
      description: undefined,
      questions: [{ prompt: "P", options: undefined, ratingLabels: undefined }],
    });
  });
});

describe("applyPresentation", () => {
  const applied = applyPresentation(
    external,
    parsePresentation({
      kind: PRESENTATION_KIND,
      title: "Off chain",
      description: "Off chain",
      questions: [
        { prompt: "First", options: ["a", "b"] },
        { prompt: "Second", options: ["a", "b"] },
      ],
    }),
  );

  it("fills empty text and keeps on-chain text", () => {
    expect(applied.title).toBe("Off chain");
    expect(applied.description).toBe("On chain");
    expect(applied.questions.map((q) => q.prompt)).toEqual(["First", "Second"]);
  });

  it("fills a count form only with exactly that many labels", () => {
    expect(applied.questions.map((q) => "options" in q && q.options)).toEqual([
      { type: "options", labels: ["a", "b"] },
      { type: "count", count: 3 },
    ]);
  });
});
