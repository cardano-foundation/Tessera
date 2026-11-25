/**
 * Error rates of one run against the labelled set.
 *
 * An item is flagged at threshold `t` when its top score, over every category
 * the provider covers, reaches `t`: a moderator acts on any flag, whatever the
 * category. The per-category rates instead read only that category's score,
 * which shows how well the provider's categories map onto this taxonomy.
 */
import { renderFields } from "./fields.js";
import type { Category, Item, Severity } from "./item.js";
import { textHash, type Scored } from "./run.js";

type Labels = Partial<Record<Category, Severity>>;

/** A labelled item with the scores its current text got. */
export interface Case {
  readonly item: Item & { readonly labels: Labels };
  readonly scores: Partial<Record<Category, number>>;
}

/** `k` of `n`. */
export interface Share {
  readonly k: number;
  readonly n: number;
}

/**
 * Shares flagged: of unlawful items and of policy items (caught), of
 * acceptable items, and of acceptable items that are near misses (false
 * flags).
 */
export interface Rates {
  readonly unlawful: Share;
  readonly policy: Share;
  readonly acceptable: Share;
  readonly nearMiss: Share;
}

/**
 * Pairs every labelled item with its latest successful line, if that line
 * scored the item's current text. The rest are counted, not guessed.
 */
export function casesOf(
  items: readonly Item[],
  lines: ReadonlyMap<string, Scored>,
): { cases: Case[]; unscored: number; failed: number } {
  const cases: Case[] = [];
  let unscored = 0;
  let failed = 0;
  for (const item of items) {
    if (item.labels === undefined) continue;
    const line = lines.get(item.id);
    if (!line || line.hash !== textHash(renderFields(item.fields))) unscored++;
    else if (line.error !== undefined) failed++;
    else
      cases.push({
        item: { ...item, labels: item.labels },
        scores: line.scores,
      });
  }
  return { cases, unscored, failed };
}

/** The most severe label, `acceptable` without one. */
export function severity(c: Case): Severity | "acceptable" {
  const severities = Object.values(c.item.labels);
  if (severities.includes("unlawful")) return "unlawful";
  return severities.includes("policy") ? "policy" : "acceptable";
}

export const top = (c: Case): number => Math.max(0, ...Object.values(c.scores));

const share = (cases: readonly Case[], hit: (c: Case) => boolean): Share => ({
  k: cases.filter(hit).length,
  n: cases.length,
});

function ratesBy(
  cases: readonly Case[],
  hit: (c: Case) => boolean,
  of: (c: Case) => string,
  near: (c: Case) => boolean,
): Rates {
  const acceptable = cases.filter((c) => of(c) === "acceptable");
  return {
    unlawful: share(
      cases.filter((c) => of(c) === "unlawful"),
      hit,
    ),
    policy: share(
      cases.filter((c) => of(c) === "policy"),
      hit,
    ),
    acceptable: share(acceptable, hit),
    nearMiss: share(acceptable.filter(near), hit),
  };
}

/** Rates when an item is flagged by its top score reaching `t`. */
export const rates = (cases: readonly Case[], t: number): Rates =>
  ratesBy(
    cases,
    (c) => top(c) >= t,
    severity,
    (c) => (c.item.nearMiss?.length ?? 0) > 0,
  );

/**
 * Rates for one category, read from its own score: its unlawful and policy
 * items, and false flags among items with no label at all.
 */
export const categoryRates = (
  cases: readonly Case[],
  category: Category,
  t: number,
): Rates =>
  ratesBy(
    cases,
    (c) => (c.scores[category] ?? 0) >= t,
    (c) =>
      Object.keys(c.item.labels).length === 0
        ? "acceptable"
        : (c.item.labels[category] ?? "other"),
    (c) => c.item.nearMiss?.includes(category) ?? false,
  );

/**
 * The highest threshold that still flags at least `target` of the items of
 * that severity, so the fewest acceptable items are flagged on the way;
 * `undefined` when no positive threshold gets there.
 */
export function threshold(
  cases: readonly Case[],
  of: Severity,
  target: number,
): number | undefined {
  const scores = cases.filter((c) => severity(c) === of).map(top);
  if (scores.length === 0) return undefined;
  const t = scores.sort((a, b) => b - a)[Math.ceil(target * scores.length) - 1];
  return t !== undefined && t > 0 ? t : undefined;
}

/** Rates per group, at threshold `t`. An item may sit in several groups. */
export function split(
  cases: readonly Case[],
  groups: (c: Case) => readonly string[],
  t: number,
): [string, Rates][] {
  const by = new Map<string, Case[]>();
  for (const c of cases)
    for (const g of groups(c)) by.set(g, [...(by.get(g) ?? []), c]);
  return [...by]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([g, of]) => [g, rates(of, t)]);
}

/**
 * Per language, the translations whose flag at `t` matches their original's.
 */
export function consistency(
  cases: readonly Case[],
  t: number,
): [string, Share][] {
  const byId = new Map(cases.map((c) => [c.item.id, c]));
  const pairs = cases.flatMap((c) => {
    const original = c.item.pairOf ? byId.get(c.item.pairOf) : undefined;
    return original ? [[c, original] as const] : [];
  });
  const langs = [...new Set(pairs.map(([c]) => c.item.lang))].sort();
  return langs.map((lang) => {
    const of = pairs.filter(([c]) => c.item.lang === lang);
    return [
      lang,
      {
        k: of.filter(([c, o]) => top(c) >= t === top(o) >= t).length,
        n: of.length,
      },
    ];
  });
}

/** The `q` quantile, nearest rank. */
export function quantile(values: readonly number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(q * sorted.length) - 1)] ?? NaN;
}
