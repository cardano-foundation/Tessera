/**
 * What stands around the questions: the survey's header and role picker, the
 * banners that qualify answering, the notice card, and the panel shown to an
 * identity that can claim none of the survey's roles.
 */

import { For, Show, type Component, type JSX } from "solid-js";
import type { Role, SurveyDefinition } from "cip-179";
import { unixTimeForRound } from "cip-179/tlock";
import {
  roleBrowserClaimable,
  roleColors,
  roleDescriptionKey,
  roleLabel,
} from "cardano-tessera-respond-core";

import { useClasses } from "./classes-context";
import { useI18n } from "./i18n-context";

/** The title, description and role picker; `children` render above the title. */
export const SurveyHeader: Component<{
  def: SurveyDefinition;
  role: Role | null;
  /** The roles offered in the picker; none hides it. */
  respondable: Role[];
  onPickRole: (r: Role) => void;
  children?: JSX.Element;
}> = (props) => {
  const i18n = useI18n();
  const cls = useClasses();
  return (
    <div class={cls.header}>
      {props.children}
      <h1 class={cls.headerTitle}>
        {props.def.title || i18n.t("respond.untitledSurvey")}
      </h1>
      <Show when={props.def.description}>
        <p class={cls.headerDesc}>{props.def.description}</p>
      </Show>

      <Show when={props.respondable.length > 0}>
        <div class={cls.roleRow}>
          <span class={cls.roleRowLabel}>{i18n.t("respond.respondingAs")}</span>
          <For each={props.respondable}>
            {(r) => (
              <button
                onClick={() => props.onPickRole(r)}
                class={cls.rolePick}
                classList={{ [cls.rolePickOn]: r === props.role }}
              >
                {roleLabel(r)}
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export const RespondedBanner: Component<{ role: Role | null }> = (props) => {
  const i18n = useI18n();
  const cls = useClasses();
  return (
    <div class={cls.respondedBanner}>
      <span class={cls.respondedCheck}>✓</span>
      <div class={cls.bannerBody}>
        <div class={cls.respondedTitle}>
          {i18n.t("respond.alreadyResponded", {
            role:
              props.role !== null
                ? roleLabel(props.role)
                : i18n.t("respond.alreadyRespondedRoleFallback"),
          })}
        </div>
        <div class={cls.respondedText}>
          {i18n.t("respond.alreadyRespondedText")}
        </div>
      </div>
    </div>
  );
};

export const SealedBanner: Component<{ round: number }> = (props) => {
  const i18n = useI18n();
  const cls = useClasses();
  return (
    <div class={cls.cardBanner}>
      <span class={cls.bannerIcon}>◆</span>
      <div class={cls.bannerBody}>
        <div class={cls.bannerTitle}>{i18n.t("respond.sealedTitle")}</div>
        <div class={cls.bannerText}>
          {i18n.t("respond.sealedTextBefore")}
          <b>{i18n.t("respond.sealedNoOne")}</b>
          {i18n.t("respond.sealedTextAfter", {
            reveal: i18n.d(unixTimeForRound(props.round), {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          })}
        </div>
      </div>
    </div>
  );
};

export const Notice: Component<{
  tone: "warn" | "muted";
  title: string;
  body: string;
}> = (props) => {
  const cls = useClasses();
  return (
    <div
      class={cls.notice}
      classList={{ [cls.noticeWarn]: props.tone === "warn" }}
    >
      <div
        class={cls.noticeTitle}
        classList={{ [cls.noticeTitleWarn]: props.tone === "warn" }}
      >
        {props.title}
      </div>
      <p class={cls.noticeBody}>{props.body}</p>
    </div>
  );
};

/** Each role the survey is open to, what it means, and whether a browser can claim it. */
export const Ineligible: Component<{ def: SurveyDefinition }> = (props) => {
  const i18n = useI18n();
  const cls = useClasses();
  return (
    <div class={cls.card}>
      <h3 class={cls.ineligibleTitle}>{i18n.t("respond.ineligibleTitle")}</h3>
      <p class={cls.ineligibleLead}>{i18n.t("respond.ineligibleLead")}</p>
      <div class={cls.ineligibleList}>
        <For each={props.def.eligibleRoles}>
          {(r) => {
            const [color, bg] = roleColors(r);
            const key = roleDescriptionKey(r);
            return (
              <div class={cls.ineligibleRow}>
                <span class={cls.roleChip} style={{ color, background: bg }}>
                  {roleLabel(r)}
                </span>
                <span class={cls.roleDesc}>
                  {key ? i18n.t(key) : ""}
                  <Show when={!roleBrowserClaimable(r)}>
                    <span class={cls.notClaimable}>
                      {i18n.t("respond.notClaimable")}
                    </span>
                  </Show>
                </span>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};
