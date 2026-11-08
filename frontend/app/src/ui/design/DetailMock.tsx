/**
 * Technical detail and optional features shown in place, each behind its own
 * disclosure, instead of behind an app-wide display mode. A mock of the foot
 * of the respond form.
 */

import type { Component, JSX } from "solid-js";

import kit from "~/ui/kit.module.css";
import css from "./design.module.css";

const Disclosure: Component<{
  summary: string;
  hint: string;
  open?: boolean;
  children: JSX.Element;
}> = (props) => (
  <details class={css.details} open={props.open}>
    <summary class={css.summary}>
      {props.summary}
      <span class={css.summaryHint}>{props.hint}</span>
    </summary>
    <div class={css.detailsBody}>{props.children}</div>
  </details>
);

export const DetailMock: Component = () => (
  <div class={css.stack}>
    <Disclosure summary="Add a rationale" hint="Optional, published with it">
      <textarea
        class={kit.field}
        rows="3"
        aria-label="Rationale"
        placeholder="Why you answered this way"
      />
    </Disclosure>
    <Disclosure summary="Technical details" hint="Survey ref, payload" open>
      <dl class={css.facts}>
        <dt>Survey ref</dt>
        <dd>9f2c…41ab#0</dd>
        <dt>Ends at epoch</dt>
        <dd>1187</dd>
        <dt>On-chain size</dt>
        <dd>412 bytes</dd>
      </dl>
    </Disclosure>
  </div>
);
