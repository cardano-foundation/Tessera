/** The six numbered meta sections of the builder, in the order they render. */

import { For, Show, createEffect, type Component } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";
import { A } from "@solidjs/router";
import { ROLE_VALUES, Role } from "cip-179";
import type { ChainTip } from "cip-179/domain";
import { QUICKNET_CHAIN_HASH_HEX } from "cip-179/tlock";

import type { Network } from "~/config";
import type { DefinitionMeta } from "~/domain/create";
import { formatEpochEndDate, formatRevealDate } from "~/tlock/drand";
import { roleColors, roleLabel, shortHash } from "~/ui/format";
import { Disclosure } from "~/ui/components/Disclosure";
import { Note } from "~/ui/components/Note";
import { SegmentedToggle } from "~/ui/components/SegmentedToggle";
import { VisGlyph } from "~/ui/components/glyphs";
import type { WalletIdentity } from "~/wallet/types";
import { t, n } from "~/i18n";
import kit from "~/ui/kit.module.css";
import css from "./create.module.css";

export const SectionHead: Component<{
  n: string;
  label: string;
  trailing?: number;
}> = (props) => (
  <h2 class={css.numberedHead}>
    {props.n} · {props.label}
    <Show when={props.trailing !== undefined}>
      <span class={css.headTrailing}> · {props.trailing}</span>
    </Show>
  </h2>
);

/** A toned callout inside a card, spaced like the hints around it. */
export const CARD_NOTE = {
  "margin-top": "10px",
  "margin-bottom": "0",
} as const;

export const DetailsSection: Component<{
  meta: DefinitionMeta;
  setMeta: SetStoreFunction<DefinitionMeta>;
}> = (props) => (
  <section>
    <SectionHead n="01" label={t("create.sectionBasics")} />
    <div class={kit.card}>
      <label class={css.block}>
        <span class={kit.fieldLabel}>{t("create.fieldTitle")}</span>
        <input
          type="text"
          value={props.meta.title}
          placeholder={t("create.titlePlaceholder")}
          onInput={(e) => props.setMeta("title", e.currentTarget.value)}
          class={kit.field}
        />
      </label>
      <label class={css.blockGap}>
        <span class={kit.fieldLabel}>{t("create.fieldDescription")}</span>
        <textarea
          value={props.meta.description}
          placeholder={t("create.descriptionPlaceholder")}
          onInput={(e) => props.setMeta("description", e.currentTarget.value)}
          rows={3}
          class={`${kit.field} ${css.textArea}`}
        />
      </label>
    </div>
  </section>
);

/**
 * The owner is the connected wallet's payment key. Without one that can own a
 * survey (none connected, or a script-based credential) the form still works;
 * publishing waits for a wallet.
 */
export const OwnerSection: Component<{
  identity: WalletIdentity | null;
  /** Whether the connected wallet's payment credential can own a survey. */
  canOwn: boolean;
}> = (props) => (
  <section class={css.section}>
    <SectionHead n="02" label={t("create.sectionWhoCanCancel")} />
    <div class={kit.card}>
      <p class={`${kit.small} ${css.flush}`}>
        <Show
          when={props.identity !== null && props.canOwn && props.identity}
          fallback={
            <>
              <b class={css.ownerHeading}>
                {props.identity === null
                  ? t("create.ownerNoWalletHeading")
                  : t("create.ownerScriptHeading")}
              </b>{" "}
              {props.identity === null
                ? t("create.ownerNoWalletBody")
                : t("create.ownerScriptBody")}
            </>
          }
        >
          {(id) => (
            <>
              <b class={css.ownerHeading}>{t("create.ownerHeading")}</b>{" "}
              {t("create.ownerBody")}
              <span class={`${kit.code} ${css.ownerKey}`}>
                key:{shortHash(id().payment.hashHex)}
              </span>
            </>
          )}
        </Show>
      </p>
    </div>
  </section>
);

export const RolesSection: Component<{
  roles: readonly Role[];
  onToggle: (r: Role) => void;
}> = (props) => (
  <section class={css.section}>
    <SectionHead n="03" label={t("create.sectionWhoCanRespond")} />
    <div class={kit.card}>
      <div class={css.rowWrap}>
        <For each={ROLE_VALUES}>
          {(r) => {
            const on = () => props.roles.includes(r);
            const [color, bg] = roleColors(r);
            return (
              <button
                type="button"
                aria-pressed={on()}
                onClick={() => props.onToggle(r)}
                class={css.roleToggle}
                classList={{ [css.roleToggleOn]: on() }}
                style={{ "--role-color": color, "--role-bg": bg }}
              >
                <span
                  class={css.checkbox}
                  classList={{ [css.checkboxOn]: on() }}
                  aria-hidden="true"
                >
                  <Show when={on()}>✓</Show>
                </span>
                {roleLabel(r)}
              </button>
            );
          }}
        </For>
      </div>
      <p class={`${kit.small} ${css.hint}`}>{t("create.rolesHint")}</p>
    </div>
  </section>
);

export const TimingSection: Component<{
  value: string;
  onInput: (v: string) => void;
  /**
   * Whether the creator plans to tie this survey to a governance Info Action.
   * The link itself is Action → Survey and lives off-chain in the action's
   * anchor, so this toggle changes no on-chain field directly. Its effect here
   * is that the end epoch is no longer free: it must equal the voting end epoch
   * of the Info Action that will advertise this survey, so we compute and lock
   * it instead of letting the creator type one that wouldn't match.
   */
  govLinked: boolean;
  onGovLinked: (linked: boolean) => void;
  tip: ChainTip | undefined;
  secondsPerEpoch: number;
  network: Network;
}> = (props) => {
  const tipEpoch = (): number | undefined => props.tip?.epoch;
  const govActionLifetime = (): number => props.tip?.govActionLifetime ?? 0;
  const govLinked = (): boolean => props.govLinked;

  // The voting deadline of an Info Action submitted in the current epoch:
  // `current + gov_action_lifetime` (the live protocol parameter, read from the
  // chain tip). The only end epoch a linked survey may carry. Undefined until
  // the tip loads, or if the parameter couldn't be read (lifetime 0) — in which
  // case we can't compute it and fall back to manual entry.
  const autoEndEpoch = (): number | undefined =>
    tipEpoch() === undefined || govActionLifetime() <= 0
      ? undefined
      : tipEpoch()! + govActionLifetime();

  // The wall-clock moment the current end epoch closes (responses stop), shown
  // like the sealed reveal time. Null until the tip loads or while the field is
  // empty/non-integer. An estimate (epoch length can change at a future fork).
  const endEpochDate = (): string | null => {
    const tip = props.tip;
    const n = Number(props.value.trim());
    if (!tip || props.value.trim() === "" || !Number.isInteger(n)) return null;
    return formatEpochEndDate(
      n,
      tip.epoch,
      tip.time,
      tip.epochSlot,
      props.secondsPerEpoch,
    );
  };

  // Lock the field only when linked *and* we actually have a value to lock to.
  const locked = (): boolean => govLinked() && autoEndEpoch() !== undefined;

  // While locked, drive the end epoch from the chain parameter, and keep it in
  // sync if the tip advances. Toggling off (or an unknown lifetime) leaves the
  // value in place and editable again.
  createEffect(() => {
    const auto = autoEndEpoch();
    if (govLinked() && auto !== undefined) props.onInput(String(auto));
  });

  // Soft warning: end_epoch must be later than the current epoch or the survey
  // is closed on arrival. (validateDefinition can't check this — it's ledger
  // state — so it's a client-side nudge, not a hard block.) Never fires while
  // linked: the auto value is always in the future.
  const tooEarly = () => {
    const n = Number(props.value.trim());
    return (
      tipEpoch() !== undefined &&
      props.value.trim() !== "" &&
      Number.isInteger(n) &&
      n <= tipEpoch()!
    );
  };
  return (
    <section class={css.section}>
      <SectionHead n="04" label={t("create.sectionTiming")} />
      <div class={kit.card} classList={{ [css.govCard]: govLinked() }}>
        <button
          type="button"
          role="switch"
          aria-checked={govLinked()}
          onClick={() => props.onGovLinked(!props.govLinked)}
          class={css.switchRow}
        >
          <span
            class={css.switchTrack}
            classList={{ [css.switchTrackGovOn]: govLinked() }}
          >
            <span
              class={css.switchKnob}
              classList={{ [css.switchKnobOn]: govLinked() }}
            />
          </span>
          <span class={css.switchText}>
            <span
              class={css.switchTitle}
              classList={{ [css.govTitleOn]: govLinked() }}
            >
              {t("create.govToggleTitle")}
            </span>
            <span class={kit.small}>{t("create.govToggleDesc")}</span>
          </span>
        </button>

        <label class={css.endEpochField}>
          <span class={`${kit.fieldLabel} ${css.endEpochLabel}`}>
            {t("create.endEpochLabel")}
            <Show when={locked()}>
              <span class={`${kit.chip} ${kit.chipGov}`}>
                {t("create.autoLockedBadge")}
              </span>
            </Show>
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={props.value}
            readOnly={locked()}
            aria-disabled={locked()}
            onInput={(e) => props.onInput(e.currentTarget.value)}
            class={`${kit.field} ${css.code} ${css.epochInput}`}
            classList={{ [css.inputLocked]: locked() }}
          />
        </label>
        <Show when={endEpochDate()}>
          {(date) => (
            <p class={css.dateLine}>{t("create.closesOn", { date: date() })}</p>
          )}
        </Show>
        <Show
          when={govLinked()}
          fallback={
            <p class={`${kit.small} ${css.hint}`}>
              {t("create.acceptedThroughEpoch", {
                hint:
                  tipEpoch() !== undefined
                    ? t("create.currentEpochIs", { epoch: tipEpoch()! })
                    : t("create.loadingEpoch"),
              })}
            </p>
          }
        >
          <Show
            when={locked()}
            fallback={
              <Note kind="warn" style={CARD_NOTE}>
                {t("create.govLifetimeUnreadable")}
              </Note>
            }
          >
            <div class={css.govNote}>
              {t("create.govNoteIntro", {
                network: props.network,
                epochParen: tipEpoch() !== undefined ? ` (${tipEpoch()})` : "",
              })}{" "}
              <b>{autoEndEpoch()}</b> (
              <span class={kit.code}>
                gov_action_lifetime = {govActionLifetime()}
              </span>
              ){t("create.govNoteOutro")}
            </div>
          </Show>
        </Show>
        <Show when={!govLinked() && tooEarly()}>
          <Note kind="warn" style={CARD_NOTE}>
            {t("create.tooEarlyWarning", { epoch: tipEpoch()! })}
          </Note>
        </Show>
      </div>
    </section>
  );
};

/** Two mutually exclusive choices, each a titled card that reads pressed. */
const ModeCard: Component<{
  on: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  sealed?: boolean;
}> = (props) => (
  <button
    type="button"
    aria-pressed={props.on}
    onClick={() => props.onClick()}
    class={css.modeCard}
    classList={{ [css.modeCardOn]: props.on }}
  >
    <span class={css.modeTitle}>
      <Show when={props.sealed}>
        <VisGlyph status="sealed" />
      </Show>
      {props.title}
    </span>
    <span class={css.modeDesc}>{props.desc}</span>
  </button>
);

export const VisibilitySection: Component<{
  mode: "public" | "sealed";
  onMode: (m: "public" | "sealed") => void;
  drandMode: "auto" | "manual";
  onDrandMode: (m: "auto" | "manual") => void;
  drandRoundText: string;
  onDrandRoundText: (v: string) => void;
  resolvedRound: number;
  /** Blank means auto. */
  paddingOverride: string;
  onPaddingOverride: (v: string) => void;
  resolvedPadding: number;
}> = (props) => (
  <section class={css.section}>
    <SectionHead n="05" label={t("create.sectionVisibility")} />
    <div class={kit.card}>
      <div class={css.modeGrid}>
        <ModeCard
          on={props.mode === "public"}
          onClick={() => props.onMode("public")}
          title={t("create.visPublicTitle")}
          desc={t("create.visPublicDesc")}
        />
        <ModeCard
          on={props.mode === "sealed"}
          onClick={() => props.onMode("sealed")}
          title={t("create.visSealedTitle")}
          desc={t("create.visSealedDesc")}
          sealed
        />
      </div>

      <Show when={props.mode === "sealed"}>
        <Show when={props.resolvedRound > 0}>
          <p class={css.dateLine}>
            {t("create.revealsOn", {
              date: formatRevealDate(props.resolvedRound),
            })}
          </p>
        </Show>
        <div class={css.neutralNote}>{t("create.sealedNote")}</div>

        <Disclosure
          class={css.disclosure}
          summary={t("create.revealSettings")}
          hint={t("create.revealSettingsHint")}
        >
          <div class={kit.fieldLabel}>{t("create.drandChainLabel")}</div>
          <div class={css.readout}>
            {QUICKNET_CHAIN_HASH_HEX.slice(0, 6)}…
            {QUICKNET_CHAIN_HASH_HEX.slice(-3)} · quicknet
          </div>

          <div class={`${kit.fieldLabel} ${css.labelGap}`}>
            {t("create.revealRoundLabel")}
          </div>
          <SegmentedToggle
            ariaLabel={t("create.revealRoundLabel")}
            value={props.drandMode}
            onChange={props.onDrandMode}
            fontSize={13}
            buttonPadding="6px 14px"
            options={[
              { value: "auto", label: t("create.drandAuto") },
              { value: "manual", label: t("create.drandManual") },
            ]}
          />
          <Show
            when={props.drandMode === "manual"}
            fallback={
              <p class={`${kit.small} ${css.hint}`}>
                {t("create.drandAutoHint")}
              </p>
            }
          >
            <input
              type="text"
              inputMode="numeric"
              value={props.drandRoundText}
              placeholder={t("create.drandRoundPlaceholder")}
              aria-label={t("create.revealRoundLabel")}
              onInput={(e) => props.onDrandRoundText(e.currentTarget.value)}
              class={`${kit.field} ${css.code} ${css.roundInput}`}
            />
          </Show>
          <Show when={props.resolvedRound > 0}>
            <p class={`${kit.small} ${css.hint}`}>
              {t("create.resolvedRound", { round: n(props.resolvedRound) })}
            </p>
          </Show>

          <label class={css.blockGap}>
            <span class={kit.fieldLabel}>{t("create.paddingLabel")}</span>
            <input
              type="text"
              inputMode="numeric"
              value={props.paddingOverride}
              placeholder={t("create.paddingAutoPlaceholder", {
                size: n(props.resolvedPadding),
              })}
              onInput={(e) => props.onPaddingOverride(e.currentTarget.value)}
              class={`${kit.field} ${css.code} ${css.paddingInput}`}
            />
          </label>
          <p class={`${kit.small} ${css.hint}`}>
            {t("create.paddingHint", { size: n(props.resolvedPadding) })}
          </p>
        </Disclosure>
      </Show>
    </div>
  </section>
);

export const ContentSection: Component<{
  mode: "embedded" | "external";
  onMode: (m: "embedded" | "external") => void;
  hasPinning: boolean;
}> = (props) => (
  <section class={css.section}>
    <SectionHead n="06" label={t("create.sectionContent")} />
    <div class={kit.card}>
      <div class={css.modeGrid}>
        <ModeCard
          on={props.mode === "embedded"}
          onClick={() => props.onMode("embedded")}
          title={t("create.contentEmbeddedTitle")}
          desc={t("create.contentEmbeddedDesc")}
        />
        <ModeCard
          on={props.mode === "external"}
          onClick={() => props.onMode("external")}
          title={t("create.contentExternalTitle")}
          desc={t("create.contentExternalDesc")}
        />
      </div>

      <Show when={props.mode === "external"}>
        <p class={`${kit.small} ${css.hint}`}>
          {t("create.contentExternalNote")}
        </p>
        <Show when={!props.hasPinning}>
          <Note kind="warn" style={CARD_NOTE}>
            {t("create.contentNoPinningPre")}
            <A href="/settings" class={css.noteLink}>
              {t("create.contentNoPinningLink")}
            </A>
            {t("create.contentNoPinningPost")}
          </Note>
        </Show>
      </Show>
    </div>
  </section>
);
