import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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
