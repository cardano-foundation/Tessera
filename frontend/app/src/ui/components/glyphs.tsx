import { For, Show, type Component } from "solid-js";

import { epochGauge, roleAbbr, roleColors, type ViewStatus } from "~/ui/format";
import css from "./glyphs.module.css";

/**
 * 3×3 "Form" mosaic — one filled tile per question, capped at 9. Muted, it
 * marks a survey that no longer takes responses.
 */
export const FormMosaic: Component<{
  count: number;
  size?: number;
  muted?: boolean;
}> = (props) => {
  const on = () => Math.max(0, Math.min(props.count, 9));
  return (
    <span
      class={css.mosaic}
      style={
        props.size !== undefined ? { "--size": `${props.size}px` } : undefined
      }
    >
      <For each={Array.from({ length: 9 }, (_, i) => i)}>
        {(i) => (
          <span
            class={
              i >= on() ? css.tile : props.muted ? css.tileMuted : css.tileOn
            }
          />
        )}
      </For>
    </span>
  );
};

/**
 * Visibility glyph: lock = sealed, ring = public/ended, dash = cancelled or
 * invalid (an untalliable survey reads like a withdrawn one).
 */
export const VisGlyph: Component<{ status: ViewStatus }> = (props) => (
  <Show
    when={props.status === "sealed"}
    fallback={<RingOrDash status={props.status} />}
  >
    <span class={css.lock}>
      <span class={css.lockShackle} />
      <span class={css.lockBody} />
    </span>
  </Show>
);

const RingOrDash: Component<{ status: ViewStatus }> = (props) => (
  <Show
    when={props.status !== "cancelled" && props.status !== "invalid"}
    fallback={<span class={css.dash} />}
  >
    <span
      class={css.ring}
      classList={{ [css.ringEnded]: props.status === "ended" }}
    />
  </Show>
);

/**
 * One colored chip per role, wrapping onto more rows as needed. Muted, they
 * drop the role colours, for a survey that no longer takes responses.
 */
export const RoleChips: Component<{
  roles: readonly number[];
  muted?: boolean;
}> = (props) => (
  <div class={css.chips}>
    <For each={props.roles}>
      {(r) => {
        const [color, bg] = roleColors(r);
        return (
          <span
            class={css.chip}
            classList={{ [css.chipMuted]: props.muted === true }}
            style={{ "--chip-color": color, "--chip-bg": bg }}
          >
            {roleAbbr(r)}
          </span>
        );
      }}
    </For>
  </div>
);

const LEVEL_COLOR = ["var(--danger)", "var(--warn)", "var(--ok)"];

/**
 * An open survey's time left, one cell per epoch to run, like a battery: its
 * colour drops from ok to warn to danger as the last two epochs come. Beside
 * the time-left text, which says the same, so it is hidden from assistive
 * technology.
 */
export const EpochGauge: Component<{
  seconds: number;
  secondsPerEpoch: number;
  /** Sets the width; the cells share it, past 13px each. */
  class?: string;
}> = (props) => {
  const gauge = () => epochGauge(props.seconds, props.secondsPerEpoch);
  return (
    <span
      class={`${css.gauge} ${props.class ?? ""}`}
      style={{ "--gauge": LEVEL_COLOR[gauge().level - 1] }}
      aria-hidden="true"
    >
      <For each={gauge().fills}>
        {(fill, i) => (
          <span
            class={css.cell}
            classList={{ [css.cellOn]: i() < gauge().level }}
            style={{ "--fill": `${(fill * 100).toFixed(1)}%` }}
          />
        )}
      </For>
      <span
        class={css.gaugeMore}
        classList={{ [css.gaugeMoreOff]: !gauge().more }}
      />
    </span>
  );
};
