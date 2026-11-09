/**
 * Export the survey to cardano-cli's metadata file, or import one into the
 * form.
 */

import { Show, type Component } from "solid-js";

import { PLACEHOLDER_ANCHOR } from "~/domain/create";
import { ErrorBox } from "~/ui/components/Feedback";
import { Note } from "~/ui/components/Note";
import { t } from "~/i18n";
import kit from "~/ui/kit.module.css";
import { CARD_NOTE } from "./Sections";
import css from "./create.module.css";

export const SurveyFileCard: Component<{
  /** Whether the form builds a definition with no problems. */
  exportable: boolean;
  external: boolean;
  /** The definition's owner is the placeholder, not a wallet's key. */
  placeholderOwner: boolean;
  onExport: () => void;
  /** Set once an external survey's metadata is exported: its document. */
  documentReady: boolean;
  onExportDocument: () => void;
  onImport: (files: File[]) => void;
  /** An import waits for consent to replace the text in the form. */
  confirmingImport: boolean;
  onConfirmImport: () => void;
  onCancelImport: () => void;
  importError: string | null;
  /** The imported survey keeps its text in a document that was not imported. */
  importTextMissing: boolean;
}> = (props) => {
  let input!: HTMLInputElement;
  return (
    <section class={`${kit.card} ${css.fileCard}`}>
      <h2 class={css.numberedHead}>{t("create.fileHead")}</h2>
      <p class={`${kit.small} ${css.fileHint}`}>{t("create.fileHint")}</p>
      <div class={css.fileRow}>
        <button
          type="button"
          onClick={() => props.onExport()}
          disabled={!props.exportable}
          class={kit.button}
        >
          {t("create.exportFile")}
        </button>
        <button type="button" onClick={() => input.click()} class={kit.button}>
          {t("create.importFile")}
        </button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept=".json,application/json"
          onChange={(e) => {
            props.onImport([...(e.currentTarget.files ?? [])]);
            // Allow importing the same file again after an edit on disk.
            e.currentTarget.value = "";
          }}
        />
      </div>
      <Show
        when={props.exportable}
        fallback={
          <p class={`${kit.small} ${css.hint}`}>
            {t("create.exportNeedsValid")}
          </p>
        }
      >
        <Show
          when={props.placeholderOwner}
          fallback={
            <p class={`${kit.small} ${css.hint}`}>
              {t("create.exportOwnerNote")}
            </p>
          }
        >
          <Note kind="warn" style={CARD_NOTE}>
            {t("create.exportPlaceholderOwner")}
          </Note>
        </Show>
        <Show when={props.external}>
          <Note kind="warn" style={CARD_NOTE}>
            {t("create.exportExternalWarning", {
              placeholder: PLACEHOLDER_ANCHOR.uri,
            })}
          </Note>
        </Show>
      </Show>
      <Show when={props.documentReady}>
        <button
          type="button"
          onClick={() => props.onExportDocument()}
          class={`${kit.button} ${css.wide}`}
        >
          {t("create.exportDocument")}
        </button>
      </Show>
      <Show when={props.confirmingImport}>
        <div class={`${css.neutralNote} ${css.noteRow}`}>
          <span>{t("create.importReplaceConfirm")}</span>
          <div class={css.noteBtnRow}>
            <button
              type="button"
              onClick={() => props.onConfirmImport()}
              class={kit.button}
            >
              {t("create.importReplace")}
            </button>
            <button
              type="button"
              onClick={() => props.onCancelImport()}
              class={kit.button}
            >
              {t("create.importKeep")}
            </button>
          </div>
        </div>
      </Show>
      <Show when={props.importTextMissing}>
        <Note kind="warn" style={CARD_NOTE}>
          {t("create.importNoPresentation")}
        </Note>
      </Show>
      <Show when={props.importError}>
        {(message) => (
          <ErrorBox title={t("create.importFailed")} message={message()} />
        )}
      </Show>
    </section>
  );
};
