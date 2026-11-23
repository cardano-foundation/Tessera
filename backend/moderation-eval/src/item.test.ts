import { describe, expect, test } from "vitest";
import { itemProblems } from "./item.js";

const synthetic = {
  id: "syn:x",
  source: "synthetic",
  kind: "survey",
  lang: "en",
  fields: { title: "t", questions: [{ prompt: "p", options: ["a", "b"] }] },
  labels: { scam: "unlawful" },
  nearMiss: ["spam"],
  labeledBy: "author",
};

describe("itemProblems", () => {
  test("accepts a well-formed item", () => {
    expect(itemProblems(synthetic)).toEqual([]);
  });

  test("accepts an unlabelled on-chain item", () => {
    const { labels: _l, labeledBy: _b, nearMiss: _n, ...rest } = synthetic;
    expect(
      itemProblems({ ...rest, source: "onchain", network: "preview" }),
    ).toEqual([]);
  });

  test.each([
    [
      { ...synthetic, labels: undefined, labeledBy: undefined },
      "a synthetic item needs labels",
    ],
    [
      { ...synthetic, labels: { minors: "unlawful" } },
      "synthetic items never carry a minors label",
    ],
    [
      { ...synthetic, labels: { scam: "bad" } },
      "unknown severity bad for scam",
    ],
    [{ ...synthetic, nearMiss: ["scam"] }, "scam is both label and near miss"],
    [
      { ...synthetic, network: "preview" },
      "network is required on, and only on, on-chain items",
    ],
    [
      { ...synthetic, lang: "en-US" },
      "lang must be a lowercase primary language subtag",
    ],
    [{ ...synthetic, kind: "response" }, "fields.title on a response"],
    [{ ...synthetic, tags: ["clever"] }, "tags must list known tags"],
    [
      { ...synthetic, labeledBy: undefined },
      "labels and labeledBy go together",
    ],
    [{ ...synthetic, extra: 1 }, "unknown key extra"],
  ])("refuses %#", (item, problem) => {
    expect(itemProblems(JSON.parse(JSON.stringify(item)))).toContain(problem);
  });
});
