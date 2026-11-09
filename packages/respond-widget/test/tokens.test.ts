/**
 * The theming gate, over the stylesheet the widget ships: a host re-skins it
 * through the --tessera-* tokens, whose defaults are theme.ts, so the rules
 * after the token block name no color or font family of their own, every
 * token they use is defined, and every token defined is used — by the sheet
 * or by the role chips' colors. A misspelt token fails silently in a browser.
 */

import { describe, expect, it } from "vitest";
import { Role } from "cip-179";
import { roleColors } from "cardano-tessera-respond-core";

import { cssText } from "../src/styles";
import { COLORS, FONTS, RADII, tokenCss } from "../src/theme";

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const rules = strip(cssText.replace(tokenCss, ""));
const defined = new Set(
  [COLORS, FONTS, RADII].flatMap((group) =>
    Object.keys(group).map((key) => `--tessera-${key}`),
  ),
);
const used = new Set(
  [rules, ...Object.values(Role).flatMap(roleColors)].flatMap((s) =>
    [...s.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]!),
  ),
);

describe("theming tokens", () => {
  it("the sheet is the tokens plus the rules", () => {
    expect(cssText.startsWith(tokenCss)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });

  it("every custom property used is a token theme.ts defines", () => {
    for (const name of used) {
      expect(defined.has(name), `${name} is not defined`).toBe(true);
    }
  });

  it("every token theme.ts defines is used", () => {
    expect([...defined].filter((name) => !used.has(name))).toEqual([]);
  });

  it("the rules carry no literal color", () => {
    expect(
      rules.match(/#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|light-dark)\(/gi) ?? [],
    ).toEqual([]);
  });

  it("every colour follows the colour scheme, with a light fallback", () => {
    for (const [name, [light, dark]] of Object.entries(COLORS)) {
      expect(tokenCss).toContain(
        `--tessera-${name}: light-dark(${light}, ${dark});`,
      );
      expect(tokenCss).toContain(`--tessera-${name}: ${light};`);
    }
    expect(tokenCss).toContain("@supports not (color: light-dark(");
    expect(tokenCss).not.toMatch(/color-scheme/);
  });

  // `@font-face` doesn't register inside a shadow root: loading webfonts is
  // the host's job. Native controls don't inherit fonts, hence `inherit`.
  it("fonts route through tokens, and none is loaded", () => {
    expect(cssText).not.toMatch(/@font-face/);
    for (const m of rules.matchAll(/font(?:-family)?\s*:\s*([^;]+);/g)) {
      expect(m[1]!.trim()).toMatch(/^(inherit|var\(--tessera-[\w-]+\))$/);
    }
  });
});
