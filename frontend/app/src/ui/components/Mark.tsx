import type { Component } from "solid-js";

import css from "./Mark.module.css";

/** The mosaic mark: four tiles, accent and call-to-action crosswise. */
export const Mark: Component<{ size: number }> = (props) => (
  <span
    class={css.mark}
    style={{ "--size": `${props.size}px` }}
    aria-hidden="true"
  >
    <span class={css.accent} />
    <span class={css.cta} />
    <span class={css.cta} />
    <span class={css.accent} />
  </span>
);
