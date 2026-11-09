/** The per-response breakdown: one card per counted response. */

import { For, Show, createMemo, createSignal, type Component } from "solid-js";
import type { AnswerItem, Credential, SurveyDefinition } from "cip-179";
import {
  bytesToHex,
  humanizeAnswer,
  type ResponseRecord,
} from "cip-179/domain";

import { roleColors, roleLabel, safeExternalHref } from "~/ui/format";
import { TxLink } from "~/ui/components/TxLink";
import { reportHref, reportedUrl } from "~/ui/report";
import { t, n } from "~/i18n";
import kit from "~/ui/kit.module.css";
import css from "./results.module.css";

/** How many individual responses to render before the "show all" expansion. */
const RESPONSE_PAGE = 50;

/**
 * Per-response breakdown: one card per counted response, showing the voter
 * (role + credential), each answer rendered against the (enriched) definition's
 * labels, a link to the response transaction, and — when present — a link that
 * opens the voter's rationale document in a new tab.
 *
 * Everything here is already plaintext on-chain (for sealed surveys these are
 * the post-reveal decrypted records), so this exposes nothing the explorer or
 * CSV export doesn't. Starts collapsed and renders incrementally so a survey
 * with many responses doesn't mount hundreds of cards eagerly.
 */
export const IndividualResponses: Component<{
  def: SurveyDefinition;
  keyStr: string;
  records: ResponseRecord[];
}> = (props) => {
  const [open, setOpen] = createSignal(false);
  const [limit, setLimit] = createSignal(RESPONSE_PAGE);
  const shown = createMemo(() =>
    open() ? props.records.slice(0, limit()) : [],
  );
  const remaining = () => props.records.length - shown().length;

  return (
    <div class={css.individual}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={props.records.length === 0}
        aria-expanded={open()}
        class={kit.button}
      >
        {t("survey.individualResponses")}
        <span class={css.individualCount}>{n(props.records.length)}</span>
        <span class={css.caret} aria-hidden="true">
          {open() ? "▴" : "▾"}
        </span>
      </button>

      <Show when={open()}>
        <div class={css.individualList}>
          <For each={shown()}>
            {(rec) => (
              <ResponseCard rec={rec} def={props.def} keyStr={props.keyStr} />
            )}
          </For>
        </div>
        <Show when={remaining() > 0}>
          <button
            onClick={() => setLimit((prev) => prev + RESPONSE_PAGE)}
            class={`${kit.button} ${kit.quiet} ${css.showMore}`}
          >
            {t("survey.showMore", {
              n: n(Math.min(RESPONSE_PAGE, remaining())),
              left: n(remaining()),
            })}
          </button>
        </Show>
      </Show>
    </div>
  );
};

const ResponseCard: Component<{
  rec: ResponseRecord;
  def: SurveyDefinition;
  keyStr: string;
}> = (props) => {
  const r = () => props.rec.response;
  const publicAnswers = (): readonly AnswerItem[] | null => {
    const ans = r().answers;
    return ans.type === "public" ? ans.answers : null;
  };
  const [color, bg] = roleColors(r().role);
  return (
    <div class={css.responseCard}>
      <div class={css.responseHead}>
        <span
          class={css.responseRole}
          style={{ "--role-color": color, "--role-bg": bg }}
        >
          {roleLabel(r().role)}
        </span>
        <span title={fullCred(r().credential)} class={css.responseCred}>
          {shortCred(r().credential)}
        </span>
        <Show when={r().rationale}>
          {(anchor) => (
            // Only render the link when the (attacker-controlled, on-chain)
            // rationale URI resolves to a safe https/ipfs href; a `javascript:`
            // or other scheme yields null and no link at all.
            <Show when={safeExternalHref(anchor().uri)}>
              {(href) => (
                <a
                  href={href()}
                  target="_blank"
                  rel="ugc nofollow noopener noreferrer"
                  title={t("survey.responseRationaleTitle")}
                  class={`${kit.link} ${css.responseRationale}`}
                >
                  {t("survey.responseRationale")}
                </a>
              )}
            </Show>
          )}
        </Show>
        <span class={css.responseTx}>
          <TxLink hash={props.rec.txHash} color="var(--muted)" />
        </span>
        <a
          href={reportHref(reportedUrl(props.keyStr, props.rec))}
          title={t("survey.reportResponseTitle")}
          class={`${kit.link} ${css.responseReport}`}
        >
          {t("survey.reportResponse")}
        </a>
      </div>

      <Show
        when={publicAnswers()}
        fallback={
          <div class={css.responseSealed}>{t("survey.responseSealed")}</div>
        }
      >
        {(answers) => (
          <div class={css.responseAnswers}>
            <For each={answers()}>
              {(a) => {
                const q = props.def.questions[a.questionIndex];
                return (
                  <div class={css.responseAnswer}>
                    <span class={css.responseAnswerQ}>
                      {t("survey.responseAnswerQ", { n: a.questionIndex + 1 })}
                    </span>
                    <div class={css.responseAnswerMain}>
                      <div class={css.responseAnswerPrompt}>
                        {q?.prompt || t("survey.noPrompt")}
                      </div>
                      <div class={css.responseAnswerValue}>
                        {humanizeAnswer(a, q)}
                      </div>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        )}
      </Show>
    </div>
  );
};

/** Compact one-line form of a responder credential, full value in `title`. */
function shortCred(cred: Credential): string {
  const h =
    cred.type === "key"
      ? bytesToHex(cred.keyHash)
      : bytesToHex(cred.scriptHash);
  const prefix = cred.type === "key" ? "key" : "script";
  return `${prefix}:${h.slice(0, 12)}…${h.slice(-6)}`;
}

function fullCred(cred: Credential): string {
  return cred.type === "key"
    ? `key:${bytesToHex(cred.keyHash)}`
    : `script:${bytesToHex(cred.scriptHash)}`;
}
