/**
 * The mosaic mark, and the header proposed for the reworked shell at phone
 * and desktop widths. A mock: its links go nowhere and its buttons do nothing.
 */

import { Show, type Component } from "solid-js";

import { SegmentedToggle } from "~/ui/components/SegmentedToggle";
import kit from "~/ui/kit.module.css";
import css from "./design.module.css";

export const Mark: Component<{ size: number }> = (props) => (
  <span class={css.mark} style={{ "--size": `${props.size}px` }}>
    <span class={css.tileAccent} />
    <span class={css.tileCta} />
    <span class={css.tileCta} />
    <span class={css.tileAccent} />
  </span>
);

const ThemeIcon: Component = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
    <circle
      cx="10"
      cy="10"
      r="7"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
    />
    <path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor" />
  </svg>
);

const Bar: Component<{ phone: boolean }> = (props) => (
  <div class={css.bar} classList={{ [css.barPhone]: props.phone }}>
    <span class={css.brand}>
      <Mark size={20} />
      <span class={css.wordmark}>Tessera</span>
    </span>
    <span class={`${kit.chip} ${kit.chipWarn}`}>Preview</span>
    <Show when={!props.phone}>
      <span class={css.nav}>
        <span class={css.navLink} classList={{ [css.navOn]: true }}>
          Explore
        </span>
        <span class={css.navLink}>Create</span>
        <span class={css.navLink}>Settings</span>
      </span>
    </Show>
    <span class={css.barActions}>
      <button
        class={`${kit.button} ${kit.quiet} ${css.iconButton}`}
        aria-label="Theme: system"
      >
        <ThemeIcon />
      </button>
      <Show when={!props.phone}>
        <SegmentedToggle
          ariaLabel="Display"
          value="plain"
          onChange={() => {}}
          options={[
            { value: "plain", label: "Plain" },
            { value: "pro", label: "Pro" },
          ]}
        />
      </Show>
      <button class={`${kit.button} ${kit.primary}`}>
        {props.phone ? "Connect" : "Connect wallet"}
      </button>
    </span>
  </div>
);

export const HeaderMock: Component<{ theme: string }> = (props) => (
  <div class={css.stack}>
    <div class={css.row}>
      <Mark size={16} />
      <Mark size={20} />
      <Mark size={32} />
      <Mark size={64} />
    </div>
    <div>
      <p class={kit.label}>Phone, 390 px</p>
      <div class={css.framePhone}>
        <Bar phone />
      </div>
    </div>
    <div>
      <p class={kit.label}>Desktop, 1160 px</p>
      <div
        class={css.scroll}
        tabindex="0"
        role="region"
        aria-label={`Desktop header, ${props.theme}`}
      >
        <div class={css.frameDesktop}>
          <Bar phone={false} />
        </div>
      </div>
    </div>
  </div>
);
