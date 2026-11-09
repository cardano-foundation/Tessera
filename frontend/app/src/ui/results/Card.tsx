/** The chrome every result card shares, the bars most of them draw, the notes. */

import { For, Show, type Component, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { Question } from "cip-179";

import { t } from "~/i18n";
import kit from "~/ui/kit.module.css";
import css from "./results.module.css";

const BASE_TYPE_KEY: Record<Question["type"], string> = {
  custom: "typeCustom",
  singleChoice: "typeSingleChoice",
  multiSelect: "typeMultiSelect",
  ranking: "typeRanking",
  numericRange: "typeNumericRange",
  pointsAllocation: "typePointsAllocation",
  rating: "typeRating",
};

/** Localized base type label; resolved at render time so it tracks the locale. */
const baseType = (type: Question["type"]): string =>
  t(`survey.${BASE_TYPE_KEY[type]}` as Parameters<typeof t>[0]);

/** `<base> · <suffix>`, e.g. "MULTI-SELECT · % OF RESPONDERS". */
export const typeLabel = (type: Question["type"], suffix?: string): string =>
  suffix
    ? t("survey.typeLabelJoined", { base: baseType(type), suffix })
    : baseType(type);

/** The level of a question's heading: under the page title, or a role's. */
export type HeadingLevel = 2 | 3;

export const ResultCard: Component<{
  qLabel: string;
  typeLabel: string;
  prompt: string;
  level: HeadingLevel;
  /** Right-hand count chip: how many abstained, or how many were counted. */
  tally?: string;
  children: JSX.Element;
}> = (props) => (
  <div class={kit.card}>
    <div class={css.cardHead}>
      <div class={css.cardHeadLeft}>
        <span class={`${kit.chip} ${kit.chipAccent}`}>{props.qLabel}</span>
        <div class={kit.label}>{props.typeLabel}</div>
      </div>
      <Show when={props.tally}>
        <span class={kit.chip}>{props.tally}</span>
      </Show>
    </div>
    <Dynamic component={`h${props.level}`} class={css.cardTitle}>
      {props.prompt || t("survey.noPrompt")}
    </Dynamic>
    {props.children}
  </div>
);

export interface Bar {
  readonly label: string;
  readonly meta: string;
  /** Fill fraction 0–1. */
  readonly pct: number;
}

/** Horizontal bars with a label and a right-aligned figure each. */
export const Bars: Component<{ bars: readonly Bar[] }> = (props) => (
  <Show when={props.bars.length > 0} fallback={<NoData />}>
    <div class={css.bars}>
      <For each={props.bars}>
        {(b) => (
          <div>
            <div class={css.barHead}>
              <span class={css.barLabel}>{b.label}</span>
              <span class={css.barMeta}>{b.meta}</span>
            </div>
            <div class={css.barTrack}>
              <div
                class={css.barFill}
                style={{
                  "--pct": `${Math.round(Math.max(0, Math.min(1, b.pct)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </For>
    </div>
  </Show>
);

export const NoData: Component = () => (
  <p class={`${kit.small} ${css.noData}`}>{t("survey.noResponsesYet")}</p>
);

/**
 * Marks a figure that was recomputed in the browser from the counted responses
 * rather than read from the tally artifact — true of every supplementary
 * detail, and the reason it must never be mistaken for a hash-covered number.
 */
export const DerivedNote: Component = () => (
  <span class={`${kit.label} ${css.derived}`} title={t("survey.derivedTitle")}>
    {t("survey.derived")}
  </span>
);

/**
 * Shown above every results view: Tessera's tallies are generic and indicative —
 * a survey's own validity/allow-list/weighting rules are the creator's to apply
 * and interpret. In the final (artifact) view it carries the "view raw
 * responses" escape hatch on its right.
 */
export const InfoNote: Component<{ onShowRaw?: () => void }> = (props) => (
  <div class={css.disclaimer}>
    <span class={`${kit.chip} ${kit.chipWarn} ${css.disclaimerBadge}`}>
      {t("survey.infoBadge")}
    </span>
    <span class={css.disclaimerText}>
      <b>{t("survey.infoNoteStrong")}</b> {t("survey.infoNote")}
    </span>
    <Show when={props.onShowRaw}>
      <button
        class={`${kit.button} ${kit.quiet}`}
        onClick={() => props.onShowRaw!()}
      >
        {t("survey.weightedShowRaw")}
      </button>
    </Show>
  </div>
);
