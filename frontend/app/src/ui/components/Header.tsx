import { For, Show, type Component } from "solid-js";
import { A } from "@solidjs/router";

import { useApp } from "~/state";
import { networkLinks } from "~/config";
import {
  networkMismatch,
  roleColors,
  roleDescription,
  roleLabel,
} from "~/ui/format";
import { CartBadge } from "~/ui/components/CartDrawer";
import { Mark } from "~/ui/components/Mark";
import { Menu } from "~/ui/components/Menu";
import { SegmentedToggle } from "~/ui/components/SegmentedToggle";
import { setTheme, theme } from "~/ui/theme";
import { LOCALES, locale, setLocale, t, type MsgKey } from "~/i18n";
import kit from "~/ui/kit.module.css";
import css from "./Header.module.css";

const NAV: ReadonlyArray<{ href: string; labelKey: MsgKey }> = [
  { href: "/", labelKey: "header.navExplore" },
  { href: "/create", labelKey: "header.navCreate" },
];

function truncAddr(a: string): string {
  return a.length > 16 ? `${a.slice(0, 9)}…${a.slice(-4)}` : a;
}

/**
 * The sticky bar: brand, network, the two destinations, and the cart, settings
 * and wallet menus. Under 800 px the destinations drop to a row of tabs below.
 */
export const Header: Component = () => (
  <header class={css.header}>
    <div class={css.bar}>
      <A href="/" class={css.brand} aria-label="Tessera">
        <Mark size={22} />
        <span class={css.wordmark}>Tessera</span>
      </A>
      <NetworkChip />
      <nav class={css.nav}>
        <For each={NAV}>
          {(item) => (
            <A href={item.href} class={css.navLink}>
              {t(item.labelKey)}
            </A>
          )}
        </For>
      </nav>
      <div class={css.actions}>
        <CartBadge />
        <SettingsMenu />
        <WalletMenu />
      </div>
    </div>
  </header>
);

/**
 * The active network. One deployment serves one network (see `envNetwork` in
 * `config.ts`), so the chip lists the other deployments as links instead of
 * switching in place; with none configured it is a plain label.
 */
const NetworkChip: Component = () => {
  const app = useApp();
  const chip = () =>
    `${kit.chip} ${app.config.network === "mainnet" ? "" : kit.chipWarn}`;
  return (
    <div class={css.network}>
      <Show
        when={networkLinks().length > 0}
        fallback={<span class={chip()}>{app.config.network}</span>}
      >
        <Menu
          id="network"
          buttonClass={`${chip()} ${css.netChip}`}
          label={t("header.networkChip", { network: app.config.network })}
          panelClass={`${css.menu} ${css.menuStart}`}
          button={
            <>
              {app.config.network}
              <Caret />
            </>
          }
        >
          <div class={css.menuHeading}>{t("header.network")}</div>
          <div class={`${css.menuRow} ${css.on}`}>
            {app.config.network}
            <span class={css.check}>✓</span>
          </div>
          <For each={networkLinks()}>
            {(link) => (
              <a class={css.menuRow} href={link.url}>
                {link.network}
              </a>
            )}
          </For>
          <p class={css.menuNote}>{t("header.networkNote")}</p>
        </Menu>
      </Show>
    </div>
  );
};

const SettingsMenu: Component = () => {
  const app = useApp();
  return (
    <Menu
      id="settings"
      buttonClass={`${kit.button} ${kit.quiet} ${css.iconButton}`}
      label={t("header.settings")}
      panelClass={css.menu}
      button={<SettingsIcon />}
    >
      <div class={css.menuHeading}>{t("header.theme")}</div>
      <div class={css.menuField}>
        <SegmentedToggle
          ariaLabel={t("header.theme")}
          value={theme()}
          onChange={setTheme}
          options={[
            { value: "system", label: t("header.themeSystem") },
            { value: "light", label: t("header.themeLight") },
            { value: "dark", label: t("header.themeDark") },
          ]}
        />
      </div>
      <div class={css.menuHeading}>{t("header.language")}</div>
      <div class={css.menuField}>
        <SegmentedToggle
          ariaLabel={t("header.language")}
          value={locale()}
          onChange={(v) => void setLocale(v)}
          options={LOCALES.map((l) => ({ value: l.code, label: l.name }))}
        />
      </div>
      <div class={css.menuDivider} />
      <A
        href="/settings"
        class={css.menuRow}
        onClick={() => app.setOpenMenu(null)}
      >
        {t("header.allSettings")}
      </A>
    </Menu>
  );
};

const WalletMenu: Component = () => {
  const app = useApp();
  const mismatch = () =>
    networkMismatch(app.wallet()?.identity.networkId, app.config.network);
  const roleDot = (role: number | null) =>
    mismatch()
      ? "var(--danger)"
      : role != null
        ? roleColors(role)[0]
        : "var(--muted)";

  return (
    <Show
      when={app.wallet()}
      fallback={
        <Menu
          id="wallet"
          buttonClass={`${kit.button} ${kit.primary}`}
          panelClass={css.menu}
          button={
            app.connecting() ? (
              t("header.connecting")
            ) : (
              <>
                <span class={css.wide}>{t("header.connectWallet")}</span>
                <span class={css.narrow}>{t("header.connect")}</span>
              </>
            )
          }
        >
          <WalletPicker
            onPick={(k) => {
              // connect() never rejects: it stashes failures in connectError,
              // which only renders inside this menu. Close on success only,
              // so a failure stays visible.
              void app.connect(k).then(() => {
                if (app.wallet()) app.setOpenMenu(null);
              });
            }}
          />
        </Menu>
      }
    >
      {(w) => (
        <Menu
          id="wallet"
          buttonClass={css.identity}
          panelClass={css.menu}
          button={
            <>
              <span
                class={css.dot}
                style={{ background: roleDot(app.activeRole()) }}
              />
              <span class={css.identityText}>
                <span class={css.identityRole}>
                  {(() => {
                    const r = app.activeRole();
                    return r != null ? roleLabel(r) : t("header.noRole");
                  })()}
                </span>
                <span class={css.identityAddr}>
                  {truncAddr(w().identity.changeAddressBech32)}
                </span>
              </span>
              <Caret />
            </>
          }
        >
          <div class={css.menuHeading}>{t("header.respondAs")}</div>
          <Show
            when={app.claimableRoles().length > 0}
            fallback={<p class={css.menuNote}>{t("header.noClaimableRole")}</p>}
          >
            <For each={app.claimableRoles()}>
              {(r) => (
                <button
                  type="button"
                  class={css.menuRow}
                  classList={{ [css.on]: r === app.activeRole() }}
                  aria-pressed={r === app.activeRole()}
                  title={roleDescription(r)}
                  onClick={() => {
                    app.setActiveRole(r);
                    app.setOpenMenu(null);
                  }}
                >
                  <span
                    class={css.dot}
                    style={{ background: roleColors(r)[0] }}
                  />
                  {roleLabel(r)}
                  <Show when={r === app.activeRole()}>
                    <span class={css.check}>✓</span>
                  </Show>
                </button>
              )}
            </For>
          </Show>
          <Show when={mismatch()}>
            <p class={`${css.menuNote} ${css.danger}`}>
              {t("header.networkMismatch", { network: app.config.network })}
            </p>
          </Show>
          <p class={`${css.menuNote} ${css.addr}`}>
            {truncAddr(w().identity.changeAddressBech32)}
          </p>
          <div class={css.menuDivider} />
          <button
            type="button"
            class={`${css.menuRow} ${css.danger}`}
            onClick={() => {
              app.disconnect();
              app.setOpenMenu(null);
            }}
          >
            {t("header.disconnect")}
          </button>
        </Menu>
      )}
    </Show>
  );
};

const WalletPicker: Component<{ onPick: (key: string) => void }> = (props) => {
  const app = useApp();
  // Read reactively: wallets inject asynchronously, so the list can grow after
  // the menu first opens (see `installedWallets` in state.tsx).
  const wallets = () => app.installedWallets();
  return (
    <>
      <div class={css.menuHeading}>{t("header.connectCip30")}</div>
      <Show
        when={wallets().length > 0}
        fallback={<p class={css.menuNote}>{t("header.noWalletDetected")}</p>}
      >
        <For each={wallets()}>
          {(wl) => (
            <button
              type="button"
              class={css.menuRow}
              onClick={() => props.onPick(wl.key)}
            >
              <Show when={wl.icon} fallback={<span class={css.walletIcon} />}>
                <img src={wl.icon} alt="" class={css.walletIcon} />
              </Show>
              {wl.name}
            </button>
          )}
        </For>
      </Show>
      <Show when={app.connectError()}>
        <p class={`${css.menuNote} ${css.danger}`}>{app.connectError()}</p>
      </Show>
    </>
  );
};

const Caret: Component = () => (
  <span class={css.caret} aria-hidden="true">
    ▾
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
