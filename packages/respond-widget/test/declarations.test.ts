/**
 * The published declarations stand alone: the artifact bundles every
 * dependency, so its .d.ts imports nothing, and the only global it declares
 * is the element's own tag. Solid's `declare global` blocks reach the roll-up
 * whenever the dts build inlines solid-js.
 */

import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const dts = readFileSync(
  new URL("../dist/tessera-respond.es.d.ts", import.meta.url),
  "utf8",
);

it("imports nothing", () => {
  expect(dts).not.toMatch(/^\s*import\b|\bfrom\s+["']/m);
});

it("declares only the tag map globally", () => {
  const globals = [...dts.matchAll(/declare global \{\s*(\w+ \w+)/g)].map(
    (m) => m[1],
  );
  expect(globals).toEqual(["interface HTMLElementTagNameMap"]);
});
