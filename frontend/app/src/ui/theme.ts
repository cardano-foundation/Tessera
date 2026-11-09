/**
 * The theme choice, stored under the key `public/theme.js` reads before first
 * paint. That script sets `<html data-theme>`; this module only keeps the
 * choice and tells the script to apply it again.
 */

import { createSignal } from "solid-js";

import { readText, writeText } from "~/storage";

export type ThemeChoice = "system" | "light" | "dark";

const KEY = "tessera.theme";

function stored(): ThemeChoice {
  const value = readText(KEY);
  return value === "light" || value === "dark" ? value : "system";
}

const [choice, setChoice] = createSignal(stored());

// Another tab's change arrives as a storage event; so does our own, below.
addEventListener("storage", (event) => {
  if (event.key === KEY) setChoice(stored());
});

/** The stored choice (reactive accessor). */
export const theme = choice;

export function setTheme(next: ThemeChoice): void {
  writeText(KEY, next === "system" ? undefined : next);
  // A tab gets no storage event for its own write, and the bootstrap applies
  // the choice on one.
  dispatchEvent(new StorageEvent("storage", { key: KEY }));
}
