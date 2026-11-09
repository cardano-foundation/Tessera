/**
 * One survey, in the two presentations the register switches between: a row in
 * the seven-column grid, or a self-contained card once the viewport is too
 * narrow to hold the columns.
 */

import { For, Show, type Component, type JSX } from "solid-js";
import { A } from "@solidjs/router";

import type { ChainTip, SurveyAggregate } from "cip-179/domain";

import { useApp } from "~/state";
import {
  closedDateText,
  endsText,
  isClosed,
  secondsLeft,
  shortGovId,
  viewStatus,
} from "~/ui/format";
import {
  EpochGauge,
  FormMosaic,
  RoleChips,
  VisGlyph,
} from "~/ui/components/glyphs";
import { t } from "~/i18n";
import kit from "~/ui/kit.module.css";
import css from "./explore.module.css";

/** Per-survey row flags (wallet relationship + optimistic-entry state). */
export interface Flags {
  readonly mine: boolean;
  readonly responded: boolean;
  /** Optimistic entry whose defining tx still hasn't been seen in a block. */
  readonly stuck: boolean;
}

export interface EntryProps {
  a: SurveyAggregate;
  tip: ChainTip | undefined;
  secondsPerEpoch: number;
  nowUnix: number;
  flags: Flags;
  narrow: boolean;
}

/** Pick the card or table-row presentation for the current viewport. */
export const Entry: Component<EntryProps> = (props) => (
  <Show when={props.narrow} fallback={<GridRow {...props} />}>
    <CardRow {...props} />
  </Show>
);

/**
 * Everything both presentations read off a survey. The row and the card differ
 * in layout, not in what they derive, so they derive it once here.
 */
function rowView(props: EntryProps) {
  const app = useApp();
  // Enriched from the session cache when we hold the doc (e.g. just authored);
  // otherwise the on-chain definition, where external labels are absent.
  const def = () => app.displayDefinition(props.a.record.definition);
  const status = () => viewStatus(props.a);
  return {
    def,
    status,
    labelsMissing: () => !!def().contentAnchor && def().title.trim() === "",
    closed: () => isClosed(status()),
    ends: (): string =>
      props.tip
        ? endsText(props.a, props.tip, props.secondsPerEpoch, props.nowUnix)
        : "—",
    left: (): number | undefined =>
      props.tip && !isClosed(status())
        ? secondsLeft(props.a, props.tip, props.secondsPerEpoch, props.nowUnix)
        : undefined,
    closedDate: (): string | undefined =>
      props.tip
        ? closedDateText(props.a, props.tip, props.secondsPerEpoch)
        : undefined,
  };
}

/** Inline check shown on surveys the connected wallet has answered. */
const AnsweredCheck: Component = () => (
  <span
    title={t("explore.answeredTitle")}
    aria-label={t("explore.answeredAria")}
    class={css.answered}
  >
    ✓
  </span>
);

const YoursBadge: Component = () => (
  <span class={`${kit.chip} ${kit.chipAccent} ${css.badge}`}>
    {t("explore.badgeYours")}
  </span>
);

const WarnBadge: Component<{ text: string }> = (props) => (
  <span class={`${kit.chip} ${kit.chipWarn} ${css.badge}`}>{props.text}</span>
);

const OffChainBadge: Component = () => (
  <WarnBadge text={t("explore.badgeOffChain")} />
);

/** Marks a survey whose on-chain definition is spec-invalid (untalliable). */
const InvalidBadge: Component = () => (
  <WarnBadge text={t("explore.badgeUntalliable")} />
);

/** Marks an optimistic survey whose defining tx may never land (finding 61). */
const StuckBadge: Component = () => (
  <WarnBadge text={t("explore.badgeNotOnChain")} />
);

const GovLine: Component<{
  actionId: string;
  title: string | null;
  muted: boolean;
}> = (props) => (
  <div class={css.govLine} classList={{ [css.govLineClosed]: props.muted }}>
    {"◇ "}
    {t("explore.govLinkedAction", { id: shortGovId(props.actionId) })}
    {props.title
      ? t("explore.govLinkedActionTitle", { title: props.title })
      : ""}
  </div>
);

const GridRow: Component<EntryProps> = (props) => {
  const { def, status, labelsMissing, closed, ends, left, closedDate } =
    rowView(props);
  return (
    // A router link, not a div+navigate: a plain click stays client-side (no
    // reload — wallet connection and snapshot survive), while cmd/ctrl/middle
    // click still opens the survey in a new tab natively.
    <A href={`/survey/${encodeURIComponent(props.a.key)}`} class={css.row}>
      <div class={css.formCell}>
        <FormMosaic count={def().questions.length} muted={closed()} />
        <span class={css.formCount}>{def().questions.length}</span>
      </div>
      <div class={css.centerCell}>
        <VisGlyph status={status()} />
      </div>
      <div class={css.centerCell}>
        <Show when={props.flags.responded}>
          <AnsweredCheck />
        </Show>
      </div>
      <div class={css.titleCell}>
        <div class={css.titleLine}>
          <span class={css.surveyTitle} classList={{ [css.closed]: closed() }}>
            {def().title || t("explore.untitled")}
          </span>
          <Show when={props.flags.mine}>
            <YoursBadge />
          </Show>
          <Show when={labelsMissing()}>
            <OffChainBadge />
          </Show>
          <Show when={!props.a.talliable}>
            <InvalidBadge />
          </Show>
          <Show when={props.flags.stuck}>
            <StuckBadge />
          </Show>
        </div>
        <div class={css.desc}>
          {def().description || t("explore.noPresentation")}
        </div>
        <For each={props.a.govLinks}>
          {(link) => (
            <GovLine
              actionId={link.actionId}
              title={link.title}
              muted={closed()}
            />
          )}
        </For>
      </div>
      <RoleChips roles={def().eligibleRoles} muted={closed()} />
      <div>
        <div class={css.ends} classList={{ [css.closed]: closed() }}>
          {ends()}
        </div>
        <Show when={closedDate()}>
          {(date) => <div class={css.endsDate}>{date()}</div>}
        </Show>
        <Show when={left() !== undefined}>
          <div class={css.endsGauge}>
            <EpochGauge
              seconds={left()!}
              secondsPerEpoch={props.secondsPerEpoch}
            />
          </div>
        </Show>
      </div>
      <div class={css.repliesCell}>
        <span class={css.replies} classList={{ [css.closed]: closed() }}>
          {status() === "cancelled" || status() === "invalid"
            ? "—"
            : props.a.responseCount}
        </span>
      </div>
    </A>
  );
};

/** A single labelled meta pair in the card's footer row. */
const MetaChip: Component<{ label: string; children: JSX.Element }> = (
  props,
) => (
  <span class={css.metaChip}>
    <span class={css.metaLabel}>{props.label}</span>
    <span class={css.metaValue}>{props.children}</span>
  </span>
);

const CardRow: Component<EntryProps> = (props) => {
  const { def, status, labelsMissing, closed, ends, left, closedDate } =
    rowView(props);
  return (
    <A href={`/survey/${encodeURIComponent(props.a.key)}`} class={css.card}>
      <div class={css.cardHead}>
        <span class={css.cardGlyph}>
          <VisGlyph status={status()} />
        </span>
        <Show when={props.flags.responded}>
          <AnsweredCheck />
        </Show>
        <span class={css.cardTitle} classList={{ [css.closed]: closed() }}>
          {def().title || t("explore.untitled")}
        </span>
        <Show when={props.flags.mine}>
          <YoursBadge />
        </Show>
      </div>

      <div class={css.cardDesc}>
        {def().description || t("explore.noPresentation")}
      </div>

      <Show when={labelsMissing() || !props.a.talliable}>
        <div class={css.cardBadgeRow}>
          <Show when={labelsMissing()}>
            <OffChainBadge />
          </Show>
          <Show when={!props.a.talliable}>
            <InvalidBadge />
          </Show>
          <Show when={props.flags.stuck}>
            <StuckBadge />
          </Show>
        </div>
      </Show>
      <For each={props.a.govLinks}>
        {(link) => (
          <GovLine
            actionId={link.actionId}
            title={link.title}
            muted={closed()}
          />
        )}
      </For>

      <div class={css.cardMeta}>
        <span class={css.cardForm}>
          <FormMosaic
            count={def().questions.length}
            size={16}
            muted={closed()}
          />
          {def().questions.length}
        </span>
        <Show when={def().eligibleRoles.length > 0}>
          <MetaChip label={t("explore.metaEligible")}>
            <RoleChips roles={def().eligibleRoles} muted={closed()} />
          </MetaChip>
        </Show>
        <MetaChip label={t("explore.metaEnds")}>
          {ends()}
          <Show when={closedDate()}>{(date) => <> · {date()}</>}</Show>
          <Show when={left() !== undefined}>
            <span class={css.cardGauge}>
              <EpochGauge
                seconds={left()!}
                secondsPerEpoch={props.secondsPerEpoch}
              />
            </span>
          </Show>
        </MetaChip>
        <MetaChip label={t("explore.metaReplies")}>
          {status() === "cancelled" || status() === "invalid"
            ? "—"
            : String(props.a.responseCount)}
        </MetaChip>
      </div>
    </A>
  );
};
