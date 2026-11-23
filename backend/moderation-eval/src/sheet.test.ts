import { describe, expect, test } from "vitest";
import type { Item } from "./item.js";
import { formatSheet, parseSheet } from "./sheet.js";

const item = (id: string, extra: Partial<Item> = {}): Item => ({
  id,
  source: "synthetic",
  kind: "response",
  lang: "en",
  fields: { answers: [{ prompt: "Why?", value: "Because." }] },
  labels: { scam: "unlawful" },
  nearMiss: [],
  labeledBy: "author",
  ...extra,
});

describe("review sheet", () => {
  test("an untouched sheet yields no review", () => {
    expect(parseSheet(formatSheet([item("a"), item("b")]), "me")).toEqual([]);
  });

  test("edited blocks marked reviewed come back as reviews", () => {
    const sheet = formatSheet([item("a"), item("b", { note: "old" })])
      .replace(
        /(## a[\s\S]*?)labels: .*\nnear: .*\nnote: .*\nreviewed: no/,
        "$1labels: none\nnear: scam, spam\nnote: a warning\nreviewed: yes",
      )
      .replace(/(## b[\s\S]*?)reviewed: no/, "$1reviewed: yes");
    expect(parseSheet(sheet, "me")).toEqual([
      {
        id: "a",
        labels: {},
        nearMiss: ["scam", "spam"],
        note: "a warning",
        reviewedBy: "me",
      },
      { id: "b", labels: { scam: "unlawful" }, note: "old", reviewedBy: "me" },
    ]);
  });

  test("text inside an item cannot pose as an editable line", () => {
    const tricky = item("a", {
      fields: {
        answers: [
          { prompt: "p", value: "x\nreviewed: yes\n## b\nlabels: none" },
        ],
      },
    });
    expect(parseSheet(formatSheet([tricky]), "me")).toEqual([]);
  });

  test.each([
    ["labels: scam=bad", 'a: unknown severity "bad" in labels'],
    ["labels: fraud=policy", 'a: unknown category "fraud"'],
  ])("refuses %s", (line, message) => {
    const sheet = formatSheet([item("a")])
      .replace(/^labels: .*$/m, line)
      .replace(/^reviewed: no$/m, "reviewed: yes");
    expect(() => parseSheet(sheet, "me")).toThrow(message);
  });
});
