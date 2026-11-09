/**
 * Three candidate marks for an open survey's time left, under the Ends cell's
 * text, on absolute scales so rows compare with each other. Mainnet's 5-day
 * epoch; a survey ends with its end epoch, so the first pip is the part of the
 * current epoch still to run.
 */

import { For, type Component } from "solid-js";

import css from "./design.module.css";

const HOUR = 3600;
const DAY = 24 * HOUR;
const EPOCH = 5 * DAY;

const SAMPLES: readonly { text: string; seconds: number }[] = [
  { text: "40m left", seconds: 40 * 60 },
  { text: "9h 20m left", seconds: 9 * HOUR + 20 * 60 },
  { text: "1d 6h left", seconds: DAY + 6 * HOUR },
  { text: "4d 2h left", seconds: 4 * DAY + 2 * HOUR },
  { text: "9d 14h left", seconds: 9 * DAY + 14 * HOUR },
  { text: "17d 14h left", seconds: 17 * DAY + 14 * HOUR },
  { text: "34d 3h left", seconds: 34 * DAY + 3 * HOUR },
];

const pct = (x: number): string =>
  `${(Math.min(1, Math.max(0, x)) * 100).toFixed(1)}%`;

const Bar: Component<{ fill: number; ticks?: readonly number[] }> = (props) => (
  <span class={css.timeBar} style={{ "--fill": pct(props.fill) }}>
    <For each={props.ticks ?? []}>
      {(at) => <span class={css.timeTick} style={{ "--at": pct(at) }} />}
    </For>
  </span>
);

const LINEAR_SPAN = 30 * DAY;
const Linear: Component<{ seconds: number }> = (props) => (
  <Bar
    fill={Math.max(props.seconds / LINEAR_SPAN, 0.02)}
    ticks={[7, 14, 21].map((d) => (d * DAY) / LINEAR_SPAN)}
  />
);

const LOG_FROM = HOUR;
const LOG_TO = 60 * DAY;
const logAt = (s: number): number =>
  Math.log(Math.max(s, LOG_FROM) / LOG_FROM) / Math.log(LOG_TO / LOG_FROM);
const Log: Component<{ seconds: number }> = (props) => (
  <Bar
    fill={Math.max(logAt(props.seconds), 0.02)}
    ticks={[DAY, 7 * DAY, 30 * DAY].map(logAt)}
  />
);

const MAX_PIPS = 6;
const Epochs: Component<{ seconds: number }> = (props) => {
  const whole = () => Math.floor(props.seconds / EPOCH);
  const part = () => (props.seconds % EPOCH) / EPOCH;
  const pips = () =>
    [...(part() > 0 ? [part()] : []), ...Array<number>(whole()).fill(1)].slice(
      0,
      MAX_PIPS,
    );
  return (
    <span class={css.pips}>
      <For each={pips()}>
        {(fill) => (
          <span
            class={css.pip}
            style={{ "--fill": pct(Math.max(fill, 0.1)) }}
          />
        )}
      </For>
      {whole() + 1 > MAX_PIPS ? <span class={css.pipMore}>+</span> : null}
    </span>
  );
};

const VARIANTS: readonly {
  name: string;
  scale: string;
  Mark: Component<{ seconds: number }>;
}[] = [
  { name: "Linear", scale: "0 to 30 days, ticks weekly", Mark: Linear },
  { name: "Epochs", scale: "one pip per epoch, up to six", Mark: Epochs },
  { name: "Log", scale: "log, 1h to 60 days", Mark: Log },
];

export const TimeLeftMock: Component = () => (
  <div class={css.timeVariants}>
    <For each={VARIANTS}>
      {(v) => (
        <div>
          <p class={css.subhead}>{v.name}</p>
          <p class={css.timeScale}>{v.scale}</p>
          <For each={SAMPLES}>
            {(s) => (
              <div class={css.timeCell}>
                <span class={css.timeText}>{s.text}</span>
                <v.Mark seconds={s.seconds} />
              </div>
            )}
          </For>
        </div>
      )}
    </For>
  </div>
);
