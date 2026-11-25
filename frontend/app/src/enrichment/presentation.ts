/**
 * Which definition to display for an external-content survey while its
 * presentation document loads, and whether that document is unavailable.
 */

import type { SurveyDefinition } from "cip-179";

/** Byte-wise equality of two content-anchor hashes. */
export function sameHash(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Choose the definition to display, given the current on-chain `source` and the
 * enriched value the backing resource holds (passed only when it has *resolved*
 * — `undefined` while loading, refreshing, or errored).
 *
 * The enriched value is used **only** when the current source is external and
 * the resolved enrichment belongs to the current anchor. This closes two
 * staleness traps of the backing Solid resource, whose source is
 * `d?.contentAnchor ? d : null`:
 *  - it is *not* re-run when the source turns non-external (a survey without a
 *    `contentAnchor`), so it keeps the previous survey's "ready" value — which
 *    would otherwise render survey A's labels on survey B;
 *  - it keeps the previous value across a survey switch until the new fetch
 *    settles, so an anchor-hash check is needed to reject an enrichment that has
 *    resolved for a *different* anchor.
 */
export function displayDefinitionFor(
  source: SurveyDefinition | undefined,
  enrichedReady: SurveyDefinition | undefined,
): SurveyDefinition | undefined {
  const anchor = source?.contentAnchor;
  if (!anchor) return source; // not external now → never a stale enrichment
  // `applyPresentation` preserves `contentAnchor`, so a ready enrichment carries
  // the anchor it was built for — use it only when that matches the current one.
  return enrichedReady?.contentAnchor &&
    sameHash(enrichedReady.contentAnchor.hash, anchor.hash)
    ? enrichedReady
    : source; // still loading, errored, or resolved for a different anchor
}

/**
 * Whether the presentation document is genuinely unavailable *for the current
 * survey*. True only when the current source is external, no fetch is in flight,
 * and the last settled fetch errored — so a retained error (or in-flight fetch)
 * from a previous external survey never leaks onto a non-external one.
 */
export function presentationUnavailable(
  source: SurveyDefinition | undefined,
  loading: boolean,
  errored: boolean,
): boolean {
  return !!source?.contentAnchor && !loading && errored;
}
