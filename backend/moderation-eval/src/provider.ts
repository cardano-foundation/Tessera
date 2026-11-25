import type { Category } from "./item.js";

/** What a classifier says about one text. */
export interface Verdict {
  /** In [0, 1], for each category the provider covers. */
  readonly scores: Partial<Record<Category, number>>;
  /** The provider's response, without headers, for later inspection. */
  readonly raw: unknown;
  /** US dollars, when the provider bills per call. */
  readonly cost?: number;
}

/**
 * A candidate classifier, mapped onto this set's taxonomy. A category in
 * `covers` gets a score for every text; one outside it is reported as not
 * covered, never as scored 0.
 */
export interface Provider {
  /** Part of the run file name. */
  readonly name: string;
  /** The pinned model or version, part of the run file name. */
  readonly model: string;
  readonly covers: readonly Category[];
  classify(text: string): Promise<Verdict>;
}
