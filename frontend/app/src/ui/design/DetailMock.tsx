/**
 * Detail and an optional feature, each behind its own disclosure, as at the
 * foot of the respond form.
 */

import type { Component } from "solid-js";

import { Disclosure } from "~/ui/components/Disclosure";
import kit from "~/ui/kit.module.css";
import css from "./design.module.css";

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
