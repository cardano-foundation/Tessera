/**
 * The pairings of semantic colours that tokens.css promises to keep legible,
 * and the WCAG ratio that measures them. tokens.test.ts holds both themes to
 * these pairs; the /design showcase displays them.
 */

const cross = (fgs: string[], bgs: string[]): [string, string][] =>
  fgs.flatMap((fg) => bgs.map((bg): [string, string] => [fg, bg]));

const ROLES = ["drep", "cc", "spo", "stakeholder", "keyholder"];
const TINTED = ["accent", "ok", "warn", "danger", "gov"];

/** Text over background, held to 4.5:1 (WCAG 1.4.3, normal-size text). */
export const TEXT_PAIRS: readonly [string, string][] = [
  ...cross(["ink", "body", "muted"], ["page", "card", "sunken", "chrome"]),
  ...cross([...TINTED, ...ROLES.map((r) => `role-${r}`)], ["page", "card"]),
  ["accent", "chrome"],
  ...TINTED.map((t): [string, string] => [t, `${t}-bg`]),
  ...TINTED.map((t): [string, string] => ["body", `${t}-bg`]),
  ...ROLES.map((r): [string, string] => [`role-${r}`, `role-${r}-bg`]),
  ["muted", "accent-bg"],
  ["on-accent", "accent"],
  ["on-accent", "accent-hover"],
  ["on-accent", "ok"],
  ["page", "body"],
  ["on-cta", "cta"],
  ["on-cta", "cta-hover"],
];

/**
 * A boundary that identifies a control, its state, or a chart's mark, held to
 * 3:1 (WCAG 1.4.11). The call-to-action fill isn't one: its label identifies
 * it.
 */
export const BOUNDARY_PAIRS: readonly [string, string][] = [
  ...cross(["control-line", "focus"], ["page", "card", "sunken", "chrome"]),
  ["focus", "accent-bg"],
  ...cross(["accent"], ["page", "card", "sunken"]),
];

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex);
  if (!match) throw new Error(`${hex} is not an opaque hex colour`);
  const digits =
    match[1]!.length === 3 ? match[1]!.replace(/./g, "$&$&") : match[1]!;
  const n = parseInt(digits, 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/**
 * The WCAG contrast ratio of two opaque hex colours, 1 to 21. Short `#rgb`
 * too: the build minifies the tokens.
 */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}
