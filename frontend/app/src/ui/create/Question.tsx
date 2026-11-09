/** The per-question editor: header row, prompt, and the type-specific fields. */

import { For, Show, type Component } from "solid-js";
import type { SetStoreFunction } from "solid-js/store";

import {
  QUESTION_TYPES,
  usesOptions,
  type QuestionDraft,
  type QuestionType,
} from "~/domain/create";
import { t, type MsgKey } from "~/i18n";
import { SegmentedToggle } from "~/ui/components/SegmentedToggle";
import { MinMaxRow, NumericRow, OptionsEditor } from "./Fields";
import kit from "~/ui/kit.module.css";
import css from "./create.module.css";

/** Each question type's name, as the type picker and the add buttons show it. */
export const QUESTION_TYPE_KEYS: Record<QuestionType, MsgKey> = {
  singleChoice: "create.addSingle",
  multiSelect: "create.addMulti",
  ranking: "create.addRanking",
  numericRange: "create.addNumeric",
  pointsAllocation: "create.addPoints",
  rating: "create.addRating",
  custom: "create.addCustom",
};

export const QuestionEditor: Component<{
  index: number;
  draft: QuestionDraft;
  set: SetStoreFunction<QuestionDraft[]>;
  canRemove: boolean;
  onRemove: () => void;
}> = (props) => {
  const i = () => props.index;
  return (
    <article class={kit.card}>
      <div class={css.qHeadRow}>
        <div class={css.qHeadLeft}>
          <h3 class={`${kit.chip} ${kit.chipAccent} ${css.qChip}`}>
            {t("create.questionChip", { n: props.index + 1 })}
          </h3>
          <select
            value={props.draft.type}
            aria-label={t("create.questionType", { n: props.index + 1 })}
            onChange={(e) =>
              props.set(i(), "type", e.currentTarget.value as QuestionType)
            }
            class={`${kit.field} ${css.select}`}
          >
            <For each={QUESTION_TYPES}>
              {(type) => (
                <option value={type}>{t(QUESTION_TYPE_KEYS[type])}</option>
              )}
            </For>
          </select>
        </div>
        <div class={css.qHeadRight}>
          <button
            type="button"
            aria-pressed={props.draft.required}
            onClick={() => props.set(i(), "required", !props.draft.required)}
            class={css.requiredBtn}
            classList={{ [css.requiredBtnOn]: props.draft.required }}
          >
            {props.draft.required ? t("create.required") : t("create.optional")}
          </button>
          <Show when={props.canRemove}>
            <button
              type="button"
              onClick={() => props.onRemove()}
              class={`${kit.button} ${kit.danger} ${css.removeBtn}`}
              aria-label={t("create.removeQuestion")}
            >
              ×
            </button>
          </Show>
        </div>
      </div>

      <input
        type="text"
        value={props.draft.prompt}
        placeholder={t("create.promptPlaceholder")}
        onInput={(e) => props.set(i(), "prompt", e.currentTarget.value)}
        class={`${kit.field} ${css.promptInput}`}
      />

      <div class={css.typeFields}>
        <TypeFields index={i()} draft={props.draft} set={props.set} />
      </div>
    </article>
  );
};

const TypeFields: Component<{
  index: number;
  draft: QuestionDraft;
  set: SetStoreFunction<QuestionDraft[]>;
}> = (props) => {
  const i = () => props.index;
  // Add an option row; for multi-select / ranking, raise the max to the new
  // option count when it was at the old one, so "all of them" stays all of them.
  const addOption = () => {
    const oldCount = String(props.draft.labels.length);
    const newCount = String(props.draft.labels.length + 1);
    props.set(i(), "labels", (ls) => [...ls, ""]);
    if (props.draft.type === "multiSelect") {
      props.set(i(), "maxSelections", (m) => (m === oldCount ? newCount : m));
    } else if (props.draft.type === "ranking") {
      props.set(i(), "maxRanked", (m) => (m === oldCount ? newCount : m));
    }
  };
  return (
    <>
      <Show when={usesOptions(props.draft.type)}>
        <OptionsEditor
          labels={props.draft.labels}
          onLabel={(j, v) => props.set(i(), "labels", j, v)}
          onAdd={addOption}
          onRemove={(j) =>
            props.set(i(), "labels", (ls) => ls.filter((_, k) => k !== j))
          }
        />
      </Show>

      <Show when={props.draft.type === "multiSelect"}>
        <MinMaxRow
          label={t("create.selectionsLabel")}
          min={props.draft.minSelections}
          max={props.draft.maxSelections}
          onMin={(v) => props.set(i(), "minSelections", v)}
          onMax={(v) => props.set(i(), "maxSelections", v)}
        />
      </Show>

      <Show when={props.draft.type === "ranking"}>
        <MinMaxRow
          label={t("create.rankedLabel")}
          min={props.draft.minRanked}
          max={props.draft.maxRanked}
          onMin={(v) => props.set(i(), "minRanked", v)}
          onMax={(v) => props.set(i(), "maxRanked", v)}
        />
      </Show>

      <Show when={props.draft.type === "numericRange"}>
        <NumericRow
          min={props.draft.numMin}
          max={props.draft.numMax}
          step={props.draft.numStep}
          onMin={(v) => props.set(i(), "numMin", v)}
          onMax={(v) => props.set(i(), "numMax", v)}
          onStep={(v) => props.set(i(), "numStep", v)}
        />
      </Show>

      <Show when={props.draft.type === "pointsAllocation"}>
        <label class={css.inlineField}>
          <span class={kit.fieldLabel}>{t("create.budget")}</span>
          <input
            type="text"
            inputMode="numeric"
            value={props.draft.budget}
            onInput={(e) => props.set(i(), "budget", e.currentTarget.value)}
            class={`${kit.field} ${css.code} ${css.budgetInput}`}
          />
        </label>
      </Show>

      <Show when={props.draft.type === "rating"}>
        <div class={css.ratingBlock}>
          <SegmentedToggle
            value={props.draft.ratingScale}
            onChange={(v) => props.set(i(), "ratingScale", v)}
            fontSize={13}
            buttonPadding="6px 14px"
            wrapStyle={{ "margin-bottom": "12px" }}
            options={[
              { value: "numeric", label: t("create.ratingNumericScale") },
              { value: "labels", label: t("create.ratingLabelledScale") },
            ]}
          />
          <Show
            when={props.draft.ratingScale === "numeric"}
            fallback={
              <OptionsEditor
                labels={props.draft.ratingLabels}
                addLabel={t("create.addLevel")}
                zeroBased
                endBadges
                hint={t("create.scaleHint")}
                onLabel={(j, v) => props.set(i(), "ratingLabels", j, v)}
                onAdd={() =>
                  props.set(i(), "ratingLabels", (ls) => [...ls, ""])
                }
                onRemove={(j) =>
                  props.set(i(), "ratingLabels", (ls) =>
                    ls.filter((_, k) => k !== j),
                  )
                }
              />
            }
          >
            <NumericRow
              min={props.draft.ratingMin}
              max={props.draft.ratingMax}
              step={props.draft.ratingStep}
              onMin={(v) => props.set(i(), "ratingMin", v)}
              onMax={(v) => props.set(i(), "ratingMax", v)}
              onStep={(v) => props.set(i(), "ratingStep", v)}
            />
          </Show>
          <button
            type="button"
            role="switch"
            aria-checked={props.draft.requireAll}
            onClick={() =>
              props.set(i(), "requireAll", !props.draft.requireAll)
            }
            class={`${css.switchRow} ${css.requireAllRow}`}
          >
            <span
              class={css.switchTrack}
              classList={{ [css.switchTrackOn]: props.draft.requireAll }}
            >
              <span
                class={css.switchKnob}
                classList={{ [css.switchKnobOn]: props.draft.requireAll }}
              />
            </span>
            <span class={css.switchTitle}>
              {t("create.ratingRequireAllLabel")}
            </span>
          </button>
          <p class={`${kit.small} ${css.hint}`}>
            {t("create.ratingRequireAllHint")}
          </p>
        </div>
      </Show>

      <Show when={props.draft.type === "custom"}>
        <div class={css.customFields}>
          <label class={css.block}>
            <span class={kit.fieldLabel}>{t("create.customUriLabel")}</span>
            <input
              type="text"
              value={props.draft.customUri}
              placeholder={t("create.customUriPlaceholder")}
              onInput={(e) =>
                props.set(i(), "customUri", e.currentTarget.value)
              }
              class={`${kit.field} ${css.code}`}
            />
          </label>
          <label class={css.block}>
            <span class={kit.fieldLabel}>{t("create.customHashLabel")}</span>
            <input
              type="text"
              value={props.draft.customHash}
              placeholder={t("create.customHashPlaceholder")}
              onInput={(e) =>
                props.set(i(), "customHash", e.currentTarget.value)
              }
              class={`${kit.field} ${css.code}`}
            />
          </label>
        </div>
      </Show>
    </>
  );
};
