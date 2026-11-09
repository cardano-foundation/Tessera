/** The input primitives the type-specific question fields are built from. */

import { Index, Show, type Component } from "solid-js";

import { t } from "~/i18n";
import kit from "~/ui/kit.module.css";
import css from "./create.module.css";

export const OptionsEditor: Component<{
  labels: readonly string[];
  addLabel?: string;
  /** Show 0-based indices (rating labels store the 0-based level). */
  zeroBased?: boolean;
  /** Tag the first/last rows "worst"/"best" (ordered rating scale). */
  endBadges?: boolean;
  /** Optional hint line above the rows. */
  hint?: string;
  onLabel: (j: number, v: string) => void;
  onAdd: () => void;
  onRemove: (j: number) => void;
}> = (props) => (
  <div class={css.optionsList}>
    <Show when={props.hint}>
      <p class={`${kit.small} ${css.flush}`}>{props.hint}</p>
    </Show>
    <Index each={props.labels}>
      {(label, j) => (
        <div class={css.optionRow}>
          <span class={css.optIndex}>{props.zeroBased ? j : j + 1}</span>
          <input
            type="text"
            value={label()}
            placeholder={t("create.optionPlaceholder", { n: j + 1 })}
            onInput={(e) => props.onLabel(j, e.currentTarget.value)}
            class={kit.field}
          />
          <Show when={props.endBadges && j === 0}>
            <span class={`${kit.chip} ${css.endBadge}`}>
              {t("create.endBadgeWorst")}
            </span>
          </Show>
          <Show when={props.endBadges && j === props.labels.length - 1}>
            <span class={`${kit.chip} ${kit.chipAccent} ${css.endBadge}`}>
              {t("create.endBadgeBest")}
            </span>
          </Show>
          <Show when={props.labels.length > 2}>
            <button
              type="button"
              onClick={() => props.onRemove(j)}
              class={`${kit.button} ${kit.danger} ${css.removeBtn}`}
              aria-label={t("create.removeOption", { n: j + 1 })}
            >
              ×
            </button>
          </Show>
        </div>
      )}
    </Index>
    <button
      type="button"
      onClick={() => props.onAdd()}
      class={`${kit.button} ${kit.quiet} ${css.addOptionBtn}`}
    >
      {props.addLabel ?? t("create.addOption")}
    </button>
  </div>
);

export const MinMaxRow: Component<{
  label: string;
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
}> = (props) => (
  <div class={css.fieldRow}>
    <label class={css.inlineField}>
      <span class={kit.fieldLabel}>
        {t("create.minOf", { label: props.label })}
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={props.min}
        onInput={(e) => props.onMin(e.currentTarget.value)}
        class={`${kit.field} ${css.code} ${css.miniNumber}`}
      />
    </label>
    <label class={css.inlineField}>
      <span class={kit.fieldLabel}>
        {t("create.maxOf", { label: props.label })}
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={props.max}
        onInput={(e) => props.onMax(e.currentTarget.value)}
        class={`${kit.field} ${css.code} ${css.miniNumber}`}
      />
    </label>
  </div>
);

export const NumericRow: Component<{
  min: string;
  max: string;
  step: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  onStep: (v: string) => void;
}> = (props) => (
  <div class={css.fieldRow}>
    <label class={css.inlineField}>
      <span class={kit.fieldLabel}>{t("create.min")}</span>
      <input
        type="text"
        value={props.min}
        onInput={(e) => props.onMin(e.currentTarget.value)}
        class={`${kit.field} ${css.code} ${css.miniNumber}`}
      />
    </label>
    <label class={css.inlineField}>
      <span class={kit.fieldLabel}>{t("create.max")}</span>
      <input
        type="text"
        value={props.max}
        onInput={(e) => props.onMax(e.currentTarget.value)}
        class={`${kit.field} ${css.code} ${css.miniNumber}`}
      />
    </label>
    <label class={css.inlineField}>
      <span class={kit.fieldLabel}>{t("create.stepOptional")}</span>
      <input
        type="text"
        inputMode="numeric"
        value={props.step}
        placeholder={t("create.numericStepPlaceholder")}
        onInput={(e) => props.onStep(e.currentTarget.value)}
        class={`${kit.field} ${css.code} ${css.miniNumber}`}
      />
    </label>
  </div>
);
