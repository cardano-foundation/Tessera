import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

type Theme = "light" | "dark";
const THEMES: readonly Theme[] = ["light", "dark"];

/** Every rule block of tokens.css: its selector and its custom properties. */
const blocks = [
  ...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g),
].map(([, selector, body]) => ({
  selector: selector!.replace(/\s+/g, " ").trim(),
  props: [...body!.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(
    ([, name, value]) => [name!, value!.trim()] as const,
  ),
}));

const THEME_SELECTOR: Record<Theme, string> = {
  light: ':root, [data-theme="light"]',
  dark: '[data-theme="dark"]',
};
const appliesTo = (selector: string, theme: Theme): boolean =>
  selector === ":root" ||
  selector === ":root, [data-theme]" ||
  selector === THEME_SELECTOR[theme];

function declarations(theme: Theme): Map<string, string> {
  const props = new Map<string, string>();
  for (const block of blocks.filter((b) => appliesTo(b.selector, theme))) {
    for (const [name, value] of block.props) {
      if (props.has(name)) throw new Error(`--${name} declared twice`);
      props.set(name, value);
    }
  }
  return props;
}

function resolve(props: Map<string, string>, name: string): string {
  const value = props.get(name);
  if (value === undefined) throw new Error(`--${name} is not declared`);
  const ref = /^var\(--([\w-]+)\)$/.exec(value);
  return ref ? resolve(props, ref[1]!) : value;
}

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`${hex} is not an opaque #rrggbb colour`);
  const n = parseInt(match[1]!, 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const cross = (fgs: string[], bgs: string[]): [string, string][] =>
  fgs.flatMap((fg) => bgs.map((bg): [string, string] => [fg, bg]));

const ROLES = ["drep", "cc", "spo", "stakeholder", "keyholder"];
const TINTED = ["accent", "ok", "warn", "danger", "gov"];

/** Text over background, held to 4.5:1 (WCAG 1.4.3, normal-size text). */
const TEXT: [string, string][] = [
  ...cross(["ink", "body", "muted"], ["page", "card", "sunken"]),
  ...cross([...TINTED, ...ROLES.map((r) => `role-${r}`)], ["page", "card"]),
  ...TINTED.map((t): [string, string] => [t, `${t}-bg`]),
  ...TINTED.map((t): [string, string] => ["body", `${t}-bg`]),
  ...ROLES.map((r): [string, string] => [`role-${r}`, `role-${r}-bg`]),
  ["muted", "accent-bg"],
  ["on-accent", "accent"],
  ["on-accent", "accent-hover"],
  ["on-cta", "cta"],
  ["on-cta", "cta-hover"],
];

/**
 * A boundary that identifies a control or its state, held to 3:1 (WCAG
 * 1.4.11). The call-to-action fill isn't one: its label identifies it.
 */
const BOUNDARY: [string, string][] = [
  ...cross(["control-line", "focus"], ["page", "card", "sunken"]),
  ["focus", "accent-bg"],
  ...cross(["accent"], ["page", "card"]),
];

describe.each(THEMES)("%s theme", (theme) => {
  const props = declarations(theme);

  it.each(TEXT)("text --%s on --%s reaches 4.5:1", (fg, bg) => {
    expect(
      contrast(resolve(props, fg), resolve(props, bg)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(BOUNDARY)("boundary --%s on --%s reaches 3:1", (fg, bg) => {
    expect(
      contrast(resolve(props, fg), resolve(props, bg)),
    ).toBeGreaterThanOrEqual(3);
  });

  it("resolves every token", () => {
    for (const name of props.keys())
      expect(() => resolve(props, name)).not.toThrow();
  });
});

it("maps the same semantic names in both themes", () => {
  const names = (theme: Theme) =>
    blocks
      .find((b) => b.selector === THEME_SELECTOR[theme])!
      .props.map(([name]) => name)
      .sort();
  expect(names("dark")).toEqual(names("light"));
});
