/**
 * The theming gate, over the stylesheet the widget ships: a host re-skins it
 * through the --tessera-* tokens, whose defaults are theme.css, so the rules
 * outside theme.css name no color or font family of their own, every token
 * they use is defined, and every token defined is used — by the sheet or by
 * the role chips' colors. A misspelt token fails silently in a browser.
 */

import { describe, expect, it } from "vitest";
import { Role } from "cip-179";
import { roleColors } from "cardano-tessera-respond-core";

import { cssText } from "../src/styles";
import themeCss from "../src/theme.css?inline";

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const sheet = strip(cssText);
const rules = strip(cssText.replace(themeCss, ""));
const defined = new Set(
  [...strip(themeCss).matchAll(/^\s*(--[\w-]+):/gm)].map((m) => m[1]!),
);
const used = new Set(
  [sheet, ...Object.values(Role).flatMap(roleColors)].flatMap((s) =>
    [...s.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]!),
  ),
);

describe("theming tokens", () => {
  it("the sheet is the theme plus the rules", () => {
    expect(cssText).toContain(themeCss);
    expect(rules.length).toBeGreaterThan(0);
  });

  it("every custom property used is a --tessera-* token theme.css defines", () => {
    for (const name of [...defined, ...used]) {
      expect(name).toMatch(/^--tessera-/);
    }
    for (const name of used) {
      expect(defined.has(name), `${name} is not defined`).toBe(true);
    }
  });

  it("every token theme.css defines is used", () => {
    expect([...defined].filter((name) => !used.has(name))).toEqual([]);
  });

  it("the rules carry no literal color", () => {
    expect(rules.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });

  // `@font-face` doesn't register inside a shadow root: loading webfonts is
  // the host's job. Native controls don't inherit fonts, hence `inherit`.
  it("fonts route through tokens, and none is loaded", () => {
    expect(sheet).not.toMatch(/@font-face/);
    for (const m of rules.matchAll(/font(?:-family)?\s*:\s*([^;]+);/g)) {
      expect(m[1]!.trim()).toMatch(/^(inherit|var\(--tessera-[\w-]+\))$/);
    }
  });
});
