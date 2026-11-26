import { describe, expect, test } from "vitest";
import { renderFields } from "./fields.js";
import type { Category, Item } from "./item.js";
import {
  casesOf,
  categoryRates,
  boundary,
  brier,
  consistency,
  grade,
  halves,
  mistakes,
  quantile,
  rates,
  split,
  threshold,
  type Case,
} from "./metrics.js";
import { textHash, type Scored } from "./run.js";

const item = (id: string, extra: Partial<Item> = {}): Item => ({
  id,
  source: "synthetic",
  kind: "response",
  lang: "en",
  fields: { answers: [{ prompt: "Why?", value: id }] },
  labels: {},
  labeledBy: "author",
  ...extra,
});

const scored = (
  i: Item,
  scores: Partial<Record<Category, number>>,
  extra: Partial<Scored> = {},
): Scored => ({
  id: i.id,
  hash: textHash(renderFields(i.fields)),
  scores,
  ms: 10,
  ...extra,
});

const ITEMS = [
  item("u1", { labels: { scam: "unlawful" } }),
  item("u2", { labels: { scam: "unlawful" }, tags: ["obfuscated"] }),
  item("p1", { labels: { spam: "policy" }, reviewedBy: "me" }),
  item("a1"),
  item("a2", { nearMiss: ["scam"] }),
  item("t1", { labels: { scam: "unlawful" }, lang: "fr", pairOf: "u1" }),
];
const SCORES: Record<string, Partial<Record<Category, number>>> = {
  u1: { scam: 0.9, spam: 0.1 },
  u2: { scam: 0.3, spam: 0.6 },
  p1: { scam: 0, spam: 0.8 },
  a1: { scam: 0.1, spam: 0 },
  a2: { scam: 0.7, spam: 0 },
  t1: { scam: 0.2, spam: 0 },
};
const { cases } = casesOf(
  ITEMS,
  new Map(ITEMS.map((i) => [i.id, scored(i, SCORES[i.id]!)])),
);

describe("casesOf", () => {
  test("counts stale, missing and failed lines instead of scoring them", () => {
    const [u1, u2, p1] = ITEMS as [Item, Item, Item];
    const lines = new Map([
      [u1.id, { ...scored(u1, {}), hash: "old" }],
      [u2.id, scored(u2, {}, { error: "429" })],
    ]);
    expect(casesOf([u1, u2, p1], lines)).toEqual({
      cases: [],
      unscored: 2,
      failed: 1,
    });
  });
});

describe("rates", () => {
  test("flag on the top score over all categories", () => {
    expect(rates(cases, 0.5)).toEqual({
      unlawful: { k: 2, n: 3 },
      policy: { k: 1, n: 1 },
      acceptable: { k: 1, n: 2 },
      nearMiss: { k: 1, n: 1 },
    });
  });

  test("per category, read only that category's score", () => {
    expect(categoryRates(cases, "scam", 0.5)).toEqual({
      unlawful: { k: 1, n: 3 },
      policy: { k: 0, n: 0 },
      acceptable: { k: 1, n: 2 },
      nearMiss: { k: 1, n: 1 },
    });
  });
});

describe("mistakes", () => {
  test("splits missed, misfiled and false flags", () => {
    const m = mistakes(cases, 0.5);
    const ids = (of: readonly Case[]) => of.map((c) => c.item.id);
    expect(ids(m.missed)).toEqual(["t1"]);
    expect(ids(m.misfiled)).toEqual(["u2"]);
    expect(ids(m.falseFlags)).toEqual(["a2"]);
  });
});

describe("boundary", () => {
  test("keeps scores in the band and every mistake", () => {
    const ids = boundary(cases, 0.2, 0.8, 0.5).map((c) => c.item.id);
    expect(ids).toEqual(["u2", "p1", "a2", "t1"]);
  });
});

describe("grade", () => {
  test("tells right, flagged under another category, and wrong", () => {
    const of = Object.fromEntries(cases.map((c) => [c.item.id, grade(c, 0.5)]));
    expect(of).toEqual({ u1: 2, u2: 1, p1: 2, a1: 2, a2: 0, t1: 0 });
  });
});

test("brier", () => {
  const [u1, a1] = [cases[0]!, cases[3]!];
  expect(brier([u1, a1])).toBeCloseTo((0.1 ** 2 + 0.1 ** 2) / 2);
});

test("halves keep translations with their original and split each stratum", () => {
  const scam = { labels: { scam: "unlawful" } } as const;
  const set = [
    item("big", scam),
    ...["de", "fr", "ja"].map((lang) =>
      item(`big-${lang}`, { ...scam, lang, pairOf: "big" }),
    ),
    ...["s1", "s2", "s3"].map((id) => item(id, scam)),
    item("a1"),
    item("a2"),
  ];
  const half = halves(set);
  const of = (prefix: string) =>
    set.filter((i) => i.id.startsWith(prefix)).map(half);
  expect(new Set(of("big")).size).toBe(1);
  const scamGroups = ["big", "s1", "s2", "s3"].map((id) =>
    half(set.find((i) => i.id === id)!),
  );
  expect(scamGroups.filter((h) => h === "tune")).toHaveLength(2);
  expect(new Set(of("a"))).toEqual(new Set(["tune", "holdout"]));
});

describe("threshold", () => {
  test("is the highest that catches the target share", () => {
    expect(threshold(cases, "unlawful", 0.6)).toBe(0.6);
    expect(threshold(cases, "unlawful", 1)).toBe(0.2);
  });

  test("is undefined when only flagging everything gets there", () => {
    const zero: Case[] = cases.map((c) => ({ ...c, scores: { scam: 0 } }));
    expect(threshold(zero, "unlawful", 0.5)).toBeUndefined();
    expect(threshold(cases, "policy", 1)).toBe(0.8);
  });
});

test("split puts an item in each of its groups", () => {
  const by = split(cases, (c) => c.item.tags ?? ["(none)"], 0.5);
  expect(by.map(([g, r]) => [g, r.unlawful])).toEqual([
    ["(none)", { k: 1, n: 2 }],
    ["obfuscated", { k: 1, n: 1 }],
  ]);
});

test("consistency compares a translation's flag with its original's", () => {
  expect(consistency(cases, 0.5)).toEqual([["fr", { k: 0, n: 1 }]]);
  expect(consistency(cases, 0.1)).toEqual([["fr", { k: 1, n: 1 }]]);
});

test("quantile takes the nearest rank", () => {
  expect(quantile([5, 1, 3, 2, 4], 0.5)).toBe(3);
  expect(quantile([5, 1, 3, 2, 4], 0.95)).toBe(5);
  expect(quantile([], 0.5)).toBeNaN();
});
