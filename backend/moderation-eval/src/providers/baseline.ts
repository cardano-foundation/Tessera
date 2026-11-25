import { CATEGORIES } from "../item.js";
import type { Provider } from "../provider.js";

/** Flags nothing: the floor every other provider is read against. */
export const baseline = (): Provider => ({
  name: "baseline",
  model: "none",
  covers: CATEGORIES,
  classify: async () => ({
    scores: Object.fromEntries(CATEGORIES.map((c) => [c, 0])),
    raw: null,
  }),
});
