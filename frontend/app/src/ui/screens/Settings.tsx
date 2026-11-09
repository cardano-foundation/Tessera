/**
 * Settings screen.
 *
 * Client-side preferences, stored in localStorage — nothing here touches the
 * on-chain payload:
 *  - **IPFS pinning provider tokens** (Pinata / Blockfrost / NMKR): enable
 *    in-app uploading of off-chain content (external-survey presentation docs,
 *    voter rationales). A document is pinned to every configured provider in
 *    parallel. Reading never needs these — it races public gateways.
 *  - **Koios token**: optional. With the backend configured, reads and
 *    transaction-building both go through it — no token needed. A token is only
 *    for the direct-Koios path (no backend). Applies on save.
 *
 * Theme and language live in the header's settings menu.
 */

import { For, Show, createSignal, type Component, type JSX } from "solid-js";

import { useApp } from "~/state";
import {
  activateDirectMode,
  buildCommit,
  deactivateDirectMode,
  directModeUntil,
  envIndexerUrl,
  networkLinks,
  resolveIndexerUrl,
  storedIndexerUrl,
  storeIndexerUrl,
  storedKoiosToken,
} from "~/config";
import { formatUnixDate } from "~/tlock/drand";
import { IPFS_PROVIDERS } from "~/enrichment/providers";
import { t, n } from "~/i18n";
import { usePageTitle } from "~/ui/pageTitle";
import kit from "~/ui/kit.module.css";
import css from "./Settings.module.css";

export const Settings: Component = () => {
  usePageTitle(() => t("settings.title"));
  return (
    <main class={css.main}>
      <h1 class={kit.pageTitle}>{t("settings.title")}</h1>
      <p class={css.lead}>{t("settings.lead")}</p>

      <ProvidersSection />
      <KoiosSection />
    </main>
  );
};

/** A settings section: a mono kicker above the card, then the card body. */
const Section: Component<{ head: string; children: JSX.Element }> = (props) => (
  <div class={css.section}>
    <div class={`${kit.label} ${css.sectionHead}`}>{props.head}</div>
    <div class={css.panel}>{props.children}</div>
  </div>
);

// --- IPFS pinning providers --------------------------------------------------

const ProvidersSection: Component = () => {
  const app = useApp();
  const enabledCount = () =>
    IPFS_PROVIDERS.filter((p) => app.ipfsTokens[p.id]?.trim()).length;

  return (
    <Section head={t("settings.storageSectionHead")}>
      <h2 class={kit.heading}>{t("settings.storageHeading")}</h2>
      <p class={css.prose}>
        {t("settings.storageProse1")}
        <b>{t("settings.storageProseAuthor")}</b>
        {t("settings.storageProse2")}
        <b>{t("settings.storageProseEvery")}</b>
        {t("settings.storageProse3")}
      </p>
      <div class={css.enabledCount}>
        {t("settings.enabledCount", { count: n(enabledCount()) })}
      </div>

      <div class={css.providerList}>
        <For each={IPFS_PROVIDERS}>
          {(p) => {
            const token = () => app.ipfsTokens[p.id] ?? "";
            const on = () => !!token().trim();
            return (
              <div
                class={css.providerCard}
                classList={{ [css.providerCardOn]: on() }}
              >
                <div class={css.providerRow}>
                  <span class={css.providerLabel}>{p.label}</span>
                  <span class={`${kit.chip} ${on() ? kit.chipOk : ""}`}>
                    {on()
                      ? t("settings.providerSet")
                      : t("settings.providerNotSet")}
                  </span>
                </div>
                <input
                  type="password"
                  autocomplete="off"
                  spellcheck={false}
                  value={token()}
                  onInput={(e) => app.setIpfsToken(p.id, e.currentTarget.value)}
                  placeholder={p.tokenPlaceholder}
                  aria-label={t("settings.providerTokenLabel", {
                    provider: p.label,
                  })}
                  class={`${kit.field} ${css.code}`}
                />
                <p class={kit.fieldHint}>{p.hint}</p>
              </div>
            );
          }}
        </For>
      </div>

      <div class={css.infoNote}>
        <span class={css.infoBadge}>i</span>
        <p class={css.noteText}>
          {t("settings.storageNote1")}
          <b>{t("settings.storageNoteBlake")}</b>
          {t("settings.storageNote2")}
        </p>
      </div>
    </Section>
  );
};

// --- Koios token override ----------------------------------------------------

const KoiosSection: Component = () => {
  const app = useApp();
  // Mirror the persisted override into a signal: `storedKoiosToken()` reads
  // localStorage (not reactive), so `dirty()` and the reset button wouldn't
  // refresh after save/reset without this. `storeKoiosToken` trims before
  // persisting, so we mirror the trimmed value to match.
  const [stored, setStored] = createSignal(storedKoiosToken() ?? "");
  const [draft, setDraft] = createSignal(stored());
  const [saved, setSaved] = createSignal(false);

  // Where reads come from: the serving backend (its URL) or direct Koios. Fixed
  // for the session — changing it is a config/reload concern, not live state.
  const indexerUrl = resolveIndexerUrl();
  const dirty = () => draft().trim() !== stored();

  const save = () => {
    app.setKoiosToken(draft());
    setStored(draft().trim());
    setSaved(true);
  };
  const reset = () => {
    setDraft("");
    app.setKoiosToken("");
    setStored("");
    setSaved(true);
  };

  // Backend URL override (per network, this browser only). Unlike the token,
  // the data source is constructed once at boot, so applying it is a full
  // reload — no saved-message signal needed, the page restarts.
  const storedUrl = storedIndexerUrl() ?? "";
  const [urlDraft, setUrlDraft] = createSignal(storedUrl);
  const urlDirty = () => urlDraft().trim() !== storedUrl;
  const saveUrl = () => {
    storeIndexerUrl(urlDraft());
    location.reload();
  };
  const clearUrl = () => {
    storeIndexerUrl("");
    location.reload();
  };

  // Emergency direct mode: only meaningful when a backend is configured
  // underneath the stamp — a build with none is permanently direct and has
  // nothing to revert to. Like the URL override, the mode is boot-time state,
  // so both switches reload.
  const configuredBackend = storedIndexerUrl() ?? envIndexerUrl();
  const directUntil = directModeUntil();
  const enterDirect = () => {
    activateDirectMode();
    location.reload();
  };
  const leaveDirect = () => {
    deactivateDirectMode();
    location.reload();
  };

  return (
    <Section head={t("settings.koiosSectionHead")}>
      <h2 class={kit.heading}>{t("settings.koiosHeading")}</h2>
      <p class={css.prose}>{t("settings.koiosProse")}</p>

      <dl class={css.factGrid}>
        <FactRow label={t("settings.networkLabel")}>
          <span class={css.endpoint}>{app.config.network}</span>
          <For each={networkLinks()}>
            {(link) => (
              <>
                {" · "}
                <a href={link.url}>
                  {t("settings.networkLink", { network: link.network })}
                </a>
              </>
            )}
          </For>
        </FactRow>
        <FactRow label={t("settings.dataSourceLabel")}>
          <span class={css.endpoint}>
            {indexerUrl ?? t("settings.dataSourceDirect")}
          </span>
        </FactRow>
        <FactRow label={t("settings.endpointLabel")}>
          <span class={css.endpoint}>{app.config.koiosUrl}</span>
        </FactRow>
        <FactRow label={t("settings.activeTokenLabel")}>
          <span class={`${kit.chip} ${app.koiosToken() ? kit.chipOk : ""}`}>
            {app.koiosToken()
              ? t("settings.tokenYours")
              : t("settings.tokenNone")}
          </span>
        </FactRow>
        <FactRow label={t("settings.buildLabel")}>
          <span class={css.endpoint}>{buildCommit()}</span>
        </FactRow>
      </dl>

      <label for="koios-token" class={`${kit.fieldLabel} ${css.fieldLabel}`}>
        {t("settings.koiosTokenLabel")}
      </label>
      <div class={css.tokenRow}>
        <input
          type="password"
          autocomplete="off"
          spellcheck={false}
          value={draft()}
          onInput={(e) => {
            setDraft(e.currentTarget.value);
            setSaved(false);
          }}
          placeholder={t("settings.koiosTokenPlaceholder")}
          id="koios-token"
          class={`${kit.field} ${css.code}`}
        />
        <button
          class={`${kit.button} ${kit.primary}`}
          disabled={!dirty()}
          onClick={save}
        >
          {t("settings.save")}
        </button>
        <button class={kit.button} disabled={!stored()} onClick={reset}>
          {t("settings.clearToken")}
        </button>
      </div>
      <Show when={saved()}>
        <div class={css.savedMsg} role="status">
          {t("settings.savedMsg")}
        </div>
      </Show>

      <label for="indexer-url" class={`${kit.fieldLabel} ${css.fieldLabel}`}>
        {t("settings.indexerUrlLabel")}
      </label>
      <div class={css.tokenRow}>
        <input
          type="text"
          autocomplete="off"
          spellcheck={false}
          value={urlDraft()}
          onInput={(e) => setUrlDraft(e.currentTarget.value)}
          placeholder={envIndexerUrl() ?? t("settings.indexerUrlPlaceholder")}
          id="indexer-url"
          class={`${kit.field} ${css.code}`}
        />
        <button
          class={`${kit.button} ${kit.primary}`}
          disabled={!urlDirty()}
          onClick={saveUrl}
        >
          {t("settings.save")}
        </button>
        <button class={kit.button} disabled={!storedUrl} onClick={clearUrl}>
          {t("settings.clearToken")}
        </button>
      </div>
      <p class={kit.fieldHint}>{t("settings.indexerUrlHint")}</p>

      <Show when={configuredBackend}>
        <h3 class={`${kit.fieldLabel} ${css.fieldLabel}`}>
          {t("settings.directModeLabel")}
        </h3>
        <p class={css.prose}>{t("settings.directModeProse")}</p>
        <Show
          when={directUntil}
          fallback={
            <>
              <div class={css.tokenRow}>
                <button
                  class={`${kit.button} ${kit.primary}`}
                  disabled={!app.koiosToken()}
                  onClick={enterDirect}
                >
                  {t("settings.directModeActivate")}
                </button>
              </div>
              <Show when={!app.koiosToken()}>
                <p class={css.prose}>{t("settings.directModeNeedsToken")}</p>
              </Show>
            </>
          }
        >
          {(until) => (
            <div class={css.tokenRow}>
              <span class={`${kit.chip} ${kit.chipWarn}`}>
                {t("settings.directModeActive", {
                  time: formatUnixDate(Math.floor(until() / 1000)),
                })}
              </span>
              <button class={kit.button} onClick={leaveDirect}>
                {t("settings.directModeDeactivate")}
              </button>
            </div>
          )}
        </Show>
      </Show>
    </Section>
  );
};

const FactRow: Component<{ label: string; children: JSX.Element }> = (
  props,
) => (
  <>
    <dt class={`${kit.label} ${css.factLabel}`}>{props.label}</dt>
    <dd class={css.factValue}>{props.children}</dd>
  </>
);
