import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLORS as WIDGET_COLORS } from "cardano-tessera-respond/theme";

import { BOUNDARY_PAIRS, TEXT_PAIRS, contrast } from "./tokens";

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

describe.each(THEMES)("%s theme", (theme) => {
  const props = declarations(theme);

  it.each(TEXT_PAIRS)("text --%s on --%s reaches 4.5:1", (fg, bg) => {
    expect(
      contrast(resolve(props, fg), resolve(props, bg)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(BOUNDARY_PAIRS)("boundary --%s on --%s reaches 3:1", (fg, bg) => {
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

// The widget's defaults are what a third-party host gets, so they are this
// file's semantic colours, held to the same pairs.
describe("the widget's tokens", () => {
  const colors = Object.entries(WIDGET_COLORS);
  const light = declarations("light");

  it.each(colors)("--tessera-%s maps onto its namesake", (name) => {
    expect(light.get(`tessera-${name}`)).toBe(`var(--${name})`);
  });

  it.each(colors)("--tessera-%s defaults to its value", (name, pair) => {
    expect(THEMES.map((theme) => resolve(declarations(theme), name))).toEqual(
      pair,
    );
  });
});

describe("stylesheets outside tokens.css", () => {
  const root = new URL("..", import.meta.url);
  const files = readdirSync(root, { recursive: true, encoding: "utf8" });
  const read = (f: string) => readFileSync(new URL(f, root), "utf8");
  const sheets = files
    .filter((f) => f.endsWith(".css") && !f.endsWith("tokens.css"))
    .map((f) => [f, read(f).replace(/\/\*[\s\S]*?\*\//g, "")] as const);
  // Custom properties a component sets inline, from TSX, for its sheet to read.
  const setInline = new Set(
    files
      .filter((f) => f.endsWith(".tsx"))
      .flatMap((f) => [...read(f).matchAll(/"--([\w-]+)"/g)].map((m) => m[1])),
  );
  const tokens = new Set(blocks.flatMap((b) => b.props.map(([name]) => name)));

  it.each(sheets)("%s has no colour literal", (_, text) => {
    expect(text.match(/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?)\(/gi)).toBeNull();
  });

  it.each(sheets)("%s reads only tokens or inline properties", (_, text) => {
    const read = [...text.matchAll(/var\(--([\w-]+)/g)].map((m) => m[1]!);
    expect(
      read.filter((name) => !tokens.has(name) && !setInline.has(name)),
    ).toEqual([]);
  });
});
