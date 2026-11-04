/**
 * The banners only the app shows above the form: answers restored from an
 * earlier visit, and labels that couldn't be fetched. They take the shared
 * banners' shape.
 */

import type { Component } from "solid-js";

import { shortRef } from "~/ui/format";
import { t } from "~/i18n";
import body from "./body.module.css";
import css from "./respond.module.css";

export const RestoredBanner: Component<{ onDiscard: () => void }> = (props) => (
  <div class={body.cardBanner}>
    <div class={`${body.bannerBody} ${css.restoredBody}`}>
      <div class={body.bannerTitle}>{t("respond.restoredAnswers")}</div>
    </div>
    <button type="button" onClick={props.onDiscard} class={css.discardBtn}>
      {t("respond.discardRestored")}
    </button>
  </div>
);

/**
 * External-content survey whose off-chain labels couldn't be fetched/verified.
 * The form still works: every question's type, count and constraints are
 * on-chain, and answers reference option indices (validated + tallied normally).
 */
export const LabelsAbsentBanner: Component<{ keyStr: string }> = (props) => (
  <div class={body.cardBanner}>
    <span class={body.bannerIcon}>⚠</span>
    <div class={body.bannerBody}>
      <div class={body.bannerTitle}>{t("respond.labelsAbsentTitle")}</div>
      <div class={body.bannerText}>
        {t("respond.labelsAbsentTextBefore")}
        <span class={css.refInline}>{shortRef(props.keyStr)}</span>
        {t("respond.labelsAbsentTextMid")}
        <b>{t("respond.labelsAbsentCanRespond")}</b>
        {t("respond.labelsAbsentTextAfter")}
      </div>
    </div>
  </div>
);
