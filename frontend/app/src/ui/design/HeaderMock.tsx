/**
 * The mosaic mark, and the header proposed for the reworked shell at phone
 * and desktop widths, with its menus drawn open. A mock: its links go nowhere
 * and its buttons do nothing.
 */

import { For, Show, type Component, type JSX } from "solid-js";

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

const SettingsIcon: Component = () => (
  <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
    <g
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
    >
      <path d="M3 6h1.8M9.2 6H17M3 14h7.8M15.2 14H17" />
      <circle cx="7" cy="6" r="2.2" />
      <circle cx="13" cy="14" r="2.2" />
    </g>
  </svg>
);

const Caret: Component = () => (
  <span class={css.caret} aria-hidden="true">
    ▾
  </span>
);

const Brand: Component<{ phone: boolean }> = (props) => (
  <span class={css.brand}>
    <Mark size={props.phone ? 24 : 20} />
    <Show when={!props.phone}>
      <span class={css.wordmark}>Tessera</span>
    </Show>
  </span>
);

const NetworkChip: Component = () => (
  <button
    class={`${kit.chip} ${kit.chipWarn} ${css.netChip}`}
    aria-label="Network: preprod"
    aria-haspopup="true"
    aria-expanded="false"
  >
    <span class={css.dotWarn} />
    Preprod
    <Caret />
  </button>
);

const Actions: Component<{ phone: boolean; connected: boolean }> = (props) => (
  <span class={css.barActions}>
    <Show when={props.connected}>
      <button
        class={`${kit.button} ${kit.quiet} ${css.iconButton}`}
        aria-label="Cart, 2 items"
      >
        ▤ <span class={css.count}>2</span>
      </button>
    </Show>
    <button
      class={`${kit.button} ${kit.quiet} ${css.iconButton}`}
      aria-label="Settings"
      aria-haspopup="true"
      aria-expanded="false"
    >
      <SettingsIcon />
    </button>
    <Show
      when={props.connected}
      fallback={
        <button class={`${kit.button} ${kit.primary}`}>
          {props.phone ? "Connect" : "Connect wallet"}
        </button>
      }
    >
      <button class={css.identity} aria-haspopup="true" aria-expanded="false">
        <span class={css.roleDot} />
        <span class={css.identityText}>
          <span class={css.identityRole}>DRep</span>
          <Show when={!props.phone}>
            <span class={css.identityAddr}>addr_test…x9k2</span>
          </Show>
        </span>
        <Caret />
      </button>
    </Show>
  </span>
);

const NAV = ["Explore", "Create"];

const Desktop: Component<{ connected: boolean }> = (props) => (
  <div class={css.bar}>
    <Brand phone={false} />
    <NetworkChip />
    <span class={css.nav}>
      <For each={NAV}>
        {(label, i) => (
          <span class={css.navLink} classList={{ [css.navOn]: i() === 0 }}>
            {label}
          </span>
        )}
      </For>
    </span>
    <Actions phone={false} connected={props.connected} />
  </div>
);

const Phone: Component<{ connected: boolean }> = (props) => (
  <div class={css.barPhone}>
    <div class={css.barRow}>
      <Brand phone />
      <NetworkChip />
      <Actions phone connected={props.connected} />
    </div>
    <div class={css.tabs}>
      <For each={NAV}>
        {(label, i) => (
          <span class={css.tab} classList={{ [css.navOn]: i() === 0 }}>
            {label}
          </span>
        )}
      </For>
    </div>
  </div>
);

const Menu: Component<{ title: string; children: JSX.Element }> = (props) => (
  <div>
    <p class={kit.label}>{props.title}</p>
    <div class={css.menu}>{props.children}</div>
  </div>
);

const MenuHeading: Component<{ children: JSX.Element }> = (props) => (
  <div class={css.menuHeading}>{props.children}</div>
);

const Menus: Component = () => (
  <div class={css.menus}>
    <Menu title="Network chip, open">
      <MenuHeading>Network</MenuHeading>
      <div class={`${css.menuRow} ${css.menuRowOn}`}>
        <span class={css.dotWarn} />
        preprod
        <span class={css.menuEnd}>✓</span>
      </div>
      <span class={css.menuRow}>
        <span class={css.dotOk} />
        mainnet
        <span class={css.menuEnd}>↗</span>
      </span>
      <span class={css.menuRow}>
        <span class={css.dotWarn} />
        preview
        <span class={css.menuEnd}>↗</span>
      </span>
      <p class={css.menuNote}>Each network is its own app.</p>
    </Menu>

    <Menu title="Settings, open">
      <MenuHeading>Theme</MenuHeading>
      <div class={css.menuField}>
        <SegmentedToggle
          ariaLabel="Theme"
          value="system"
          onChange={() => {}}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </div>
      <MenuHeading>Language</MenuHeading>
      <div class={css.menuField}>
        <SegmentedToggle
          ariaLabel="Language"
          value="en"
          onChange={() => {}}
          options={[
            { value: "en", label: "English" },
            { value: "fr", label: "Français" },
          ]}
        />
      </div>
      <div class={css.menuDivider} />
      <span class={`${css.menuRow} ${kit.link}`}>All settings →</span>
    </Menu>

    <Menu title="Wallet, open">
      <MenuHeading>Respond as</MenuHeading>
      <div class={`${css.menuRow} ${css.menuRowOn}`}>
        <span class={css.roleDot} />
        DRep
        <span class={css.menuEnd}>✓</span>
      </div>
      <span class={css.menuRow}>
        <span class={css.roleDotStake} />
        Stakeholder
      </span>
      <p class={`${css.menuNote} ${css.mono}`}>addr_test1qz…x9k2</p>
      <div class={css.menuDivider} />
      <span class={`${css.menuRow} ${css.menuDanger}`}>Disconnect</span>
    </Menu>
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
    <div
      class={css.scroll}
      tabindex="0"
      role="region"
      aria-label={`Phone headers, ${props.theme}`}
    >
      <div class={css.phones}>
        <div>
          <p class={kit.label}>Phone, 390 px</p>
          <div class={css.framePhone}>
            <Phone connected={false} />
          </div>
        </div>
        <div>
          <p class={kit.label}>Phone, connected with a cart</p>
          <div class={css.framePhone}>
            <Phone connected />
          </div>
        </div>
      </div>
    </div>
    <div>
      <p class={kit.label}>Desktop, 1160 px, then connected with a cart</p>
      <div
        class={css.scroll}
        tabindex="0"
        role="region"
        aria-label={`Desktop header, ${props.theme}`}
      >
        <div class={`${css.frameDesktop} ${css.stack}`}>
          <Desktop connected={false} />
          <Desktop connected />
        </div>
      </div>
    </div>
    <Menus />
  </div>
);
