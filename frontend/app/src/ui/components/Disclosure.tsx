import type { JSX, ParentComponent } from "solid-js";

import css from "./Disclosure.module.css";

/**
 * Detail or an optional feature, shown in place behind its own summary line.
 * Closed unless `open`; the hint says what is inside before it is opened.
 */
export const Disclosure: ParentComponent<{
  summary: JSX.Element;
  hint?: string;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  class?: string;
}> = (props) => (
  <details
    class={`${css.details} ${props.class ?? ""}`}
    open={props.open}
    onToggle={(e) => props.onToggle?.(e.currentTarget.open)}
  >
    <summary class={css.summary}>
      {props.summary}
      <span class={css.hint}>{props.hint}</span>
    </summary>
    <div class={css.body}>{props.children}</div>
  </details>
);
