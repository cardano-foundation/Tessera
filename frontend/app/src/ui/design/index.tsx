/**
 * The design showcase at /design, linked from nowhere: every token, text
 * style, control and shared component, each section in both themes side by
 * side. It renders the app's real components, so what it shows is what the
 * screens get. Its own prose is English only: it is a review page, not a
 * screen.
 */

import {
  For,
  Show,
  createSignal,
  onMount,
  type Component,
  type JSX,
} from "solid-js";
import { createStore } from "solid-js/store";
import { ROLE_VALUES, Role } from "cip-179";
import { initDraft, type Draft } from "cardano-tessera-respond-core";
import {
  Ineligible,
  Notice,
  RespondedBanner,
  SealedBanner,
} from "cardano-tessera-respond-ui";

import { Mark } from "~/ui/components/Mark";
import { Note } from "~/ui/components/Note";
import { SegmentedToggle } from "~/ui/components/SegmentedToggle";
import { FormMosaic, RoleChips, VisGlyph } from "~/ui/components/glyphs";
import { QuestionList, RespondContexts } from "~/ui/respond/Question";
import { Bars } from "~/ui/results/Card";
import { BOUNDARY_PAIRS, TEXT_PAIRS, contrast } from "~/ui/tokens";
import { usePageTitle } from "~/ui/pageTitle";
import kit from "~/ui/kit.module.css";
import { DetailMock } from "./DetailMock";
import { SAMPLE } from "./sample";
import { forceStates } from "./states";
import css from "./design.module.css";

export default function Design(): JSX.Element {
  onMount(forceStates);
  usePageTitle(() => "Design");
  return (
    <main class={css.page}>
      <h1 class={kit.pageTitle}>Design</h1>
      <p class={kit.text}>
        The tokens, text styles, controls and shared components of Tessera, in
        both themes. Each pane carries its own theme, whatever the page's.
      </p>

      <Section title="Colours">
        <Themes>{() => <Palette />}</Themes>
      </Section>

      <Section title="Type">
        <Themes>{() => <Type />}</Themes>
      </Section>

      <Section title="Controls">
        <Themes wide>{(theme) => <Controls theme={theme} />}</Themes>
      </Section>

      <Section title="Surfaces, notices and badges">
        <Themes>{() => <Surfaces />}</Themes>
      </Section>

      <Section title="Mark and network chips">
        <Themes>{() => <MarkAndNetworks />}</Themes>
      </Section>

      <Section title="Detail without a mode">
        <DetailNotes />
        <Themes>{() => <DetailMock />}</Themes>
      </Section>

      <Section title="Questions">
        <Themes>{() => <Questions />}</Themes>
      </Section>
    </main>
  );
}

const Section: Component<{ title: string; children: JSX.Element }> = (
  props,
) => (
  <section class={css.section}>
    <h2 class={kit.heading}>{props.title}</h2>
    {props.children}
  </section>
);

const MarkAndNetworks: Component = () => (
  <div class={css.stack}>
    <div class={css.row}>
      <For each={[16, 22, 32, 64]}>{(size) => <Mark size={size} />}</For>
    </div>
    <div class={css.row}>
      <span class={`${kit.chip} ${kit.chipWarn}`}>preprod</span>
      <span class={`${kit.chip} ${kit.chipWarn}`}>preview</span>
      <span class={kit.chip}>mainnet</span>
    </div>
    <p class={kit.small}>
      A test network wears the warning chip; mainnet, the real one, the plain
      chip.
    </p>
  </div>
);

const DetailNotes: Component = () => (
  <ol class={`${kit.text} ${css.notes}`}>
    <li>
      Today, Pro resets to Plain on every load. It gates two kinds of thing. The
      first is readouts: the survey ref, the end epoch, the drand chain and
      round, and the on-chain preview. The second is features: the voter
      rationale, a manual reveal round, the padding override, and the custom
      question type.
    </li>
    <li>
      Proposed: no mode. Readouts sit in a closed "Technical details" disclosure
      where they apply. Features sit in place, each behind its own optional
      disclosure. A screen opens what it needs, with no trip to the header or to
      Settings.
    </li>
    <li>
      Removed: the mode in the app state, the header toggle, the Display section
      of Settings, and the pro props in Explore and Create.
    </li>
  </ol>
);

const THEMES = ["light", "dark"] as const;
type Theme = (typeof THEMES)[number];

/** Its content once per theme; side by side when there is room, unless wide. */
const Themes: Component<{
  wide?: boolean;
  children: (theme: Theme) => JSX.Element;
}> = (props) => (
  <div class={css.themes} classList={{ [css.wide]: props.wide === true }}>
    <For each={THEMES}>
      {(theme) => (
        <div data-theme={theme} class={css.pane}>
          <p class={kit.label}>{theme}</p>
          {props.children(theme)}
        </div>
      )}
    </For>
  </div>
);

// --- Colours ---------------------------------------------------------------

const COLOURS = [...new Set([...TEXT_PAIRS, ...BOUNDARY_PAIRS].flat())];

const Palette: Component = () => {
  let root!: HTMLDivElement;
  const [value, setValue] = createSignal<(name: string) => string>(() => "");
  onMount(() => {
    const style = getComputedStyle(root);
    setValue(
      () => (name: string) => style.getPropertyValue(`--${name}`).trim(),
    );
  });
  const ratio = (fg: string, bg: string): string => {
    const [a, b] = [value()(fg), value()(bg)];
    return a && b ? contrast(a, b).toFixed(2) : "";
  };
  return (
    <div ref={root}>
      <div class={css.swatches}>
        <For each={COLOURS}>
          {(name) => (
            <div class={css.swatch}>
              <span
                class={css.swatchColour}
                style={{ background: `var(--${name})` }}
              />
              <span class={kit.code}>--{name}</span>
              <span class={`${kit.code} ${css.swatchValue}`}>
                {value()(name)}
              </span>
            </div>
          )}
        </For>
      </div>

      <h3 class={css.subhead}>Text on background, at least 4.5:1</h3>
      <div class={css.pairs}>
        <For each={TEXT_PAIRS}>
          {([fg, bg]) => (
            <div
              class={css.pair}
              style={{ color: `var(--${fg})`, background: `var(--${bg})` }}
            >
              <span class={css.pairSample}>Aa</span>
              <span>
                {fg}
                <br />
                on {bg}
              </span>
              <span class={css.pairRatio}>{ratio(fg, bg)}</span>
            </div>
          )}
        </For>
      </div>

      <h3 class={css.subhead}>Boundaries, at least 3:1</h3>
      <div class={css.pairs}>
        <For each={BOUNDARY_PAIRS}>
          {([fg, bg]) => (
            <div class={css.pair} style={{ background: `var(--${bg})` }}>
              <span
                class={css.pairRing}
                style={{ "border-color": `var(--${fg})` }}
              />
              <span>
                {fg}
                <br />
                on {bg}
              </span>
              <span class={css.pairRatio}>{ratio(fg, bg)}</span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

// --- Type ------------------------------------------------------------------

const STYLES: ReadonlyArray<{ class: string; name: string; text: string }> = [
  {
    class: kit.pageTitle,
    name: "Page title · Chivo 300",
    text: "Explore surveys",
  },
  {
    class: kit.surveyTitle,
    name: "Survey title · Newsreader 600",
    text: "Treasury priorities for the next cycle",
  },
  { class: kit.heading, name: "Heading · Chivo 400", text: "Results by role" },
  {
    class: kit.text,
    name: "Text · Chivo 400",
    text: "Responses are counted per role and never merged into one figure. A sealed survey hides its answers until the reveal.",
  },
  {
    class: kit.small,
    name: "Small · Chivo 400",
    text: "Counted so far. The artifact settles the final figure.",
  },
  { class: kit.label, name: "Label · Chivo Mono 500", text: "Ends epoch 600" },
  {
    class: kit.code,
    name: "Code · IBM Plex Mono 400",
    text: "5910e44ca9bb9a41625280a1335a4a59941a15716d6959901c9b8e20a058649d#0",
  },
];

const WEIGHTS: ReadonlyArray<{
  family: string;
  name: string;
  weights: number[];
}> = [
  { family: "var(--sans)", name: "Chivo", weights: [200, 300, 400, 500, 600] },
  { family: "var(--mono)", name: "Chivo Mono", weights: [300, 400, 500, 600] },
  { family: "var(--serif)", name: "Newsreader", weights: [400, 500, 600, 700] },
  { family: "var(--code)", name: "IBM Plex Mono", weights: [400, 600] },
];

const Type: Component = () => (
  <div class={css.stack}>
    <For each={STYLES}>
      {(s) => (
        <div>
          <p class={kit.label}>{s.name}</p>
          <p class={s.class}>{s.text}</p>
        </div>
      )}
    </For>
    <For each={WEIGHTS}>
      {(w) => (
        <div>
          <p class={kit.label}>{w.name}</p>
          <p class={css.weights} style={{ "font-family": w.family }}>
            <For each={w.weights}>
              {(weight) => (
                <span style={{ "font-weight": weight }}>{weight} Survey</span>
              )}
            </For>
          </p>
        </div>
      )}
    </For>
  </div>
);

// --- Controls --------------------------------------------------------------

type State = "rest" | "hover" | "focus-visible" | "active" | "disabled";
const STATES: readonly State[] = [
  "rest",
  "hover",
  "focus-visible",
  "active",
  "disabled",
];

const CONTROLS: ReadonlyArray<{
  name: string;
  /** States it has no look for; their cells stay empty. */
  without?: readonly State[];
  render: () => JSX.Element;
}> = [
  {
    name: "Button",
    render: () => <button class={kit.button}>Cancel</button>,
  },
  {
    name: "Primary",
    render: () => (
      <button class={`${kit.button} ${kit.primary}`}>Submit response</button>
    ),
  },
  {
    name: "Call to action",
    render: () => <button class={`${kit.button} ${kit.cta}`}>Respond</button>,
  },
  {
    name: "Quiet",
    render: () => (
      <button class={`${kit.button} ${kit.quiet}`}>Discard draft</button>
    ),
  },
  {
    name: "Danger",
    render: () => (
      <button class={`${kit.button} ${kit.danger}`}>Cancel survey</button>
    ),
  },
  {
    name: "Link",
    without: ["disabled"],
    render: () => (
      <a class={kit.link} href="/design">
        View the transaction
      </a>
    ),
  },
  {
    name: "Text field",
    render: () => (
      <input
        class={kit.field}
        aria-label="Survey title"
        placeholder="Survey title"
      />
    ),
  },
  {
    name: "Code field",
    render: () => (
      <input
        class={`${kit.field} ${kit.code}`}
        aria-label="Transaction hash"
        value="5910e44ca9bb9a41625280a1"
      />
    ),
  },
  {
    name: "Select",
    render: () => (
      <select class={kit.field} aria-label="Question type">
        <option>Single choice</option>
        <option>Ranking</option>
      </select>
    ),
  },
  {
    name: "Checkbox",
    without: ["hover", "active"],
    render: () => (
      <label class={css.check}>
        <input type="checkbox" checked /> Required
      </label>
    ),
  },
  {
    name: "Range",
    without: ["hover", "active"],
    render: () => <input type="range" aria-label="Share" value="40" />,
  },
  {
    name: "Segmented toggle",
    without: ["disabled"],
    render: () => (
      <SegmentedToggle
        ariaLabel="Display"
        value="pro"
        onChange={() => {}}
        options={[
          { value: "plain", label: "Plain" },
          { value: "pro", label: "Pro" },
        ]}
      />
    ),
  },
];

/** The control in one state: forced on its first focusable element. */
const Specimen: Component<{ state: State; children: JSX.Element }> = (
  props,
) => {
  let cell!: HTMLDivElement;
  onMount(() => {
    const el = cell.querySelector<HTMLButtonElement>(
      "a, button, input, select, textarea",
    );
    if (!el || props.state === "rest") return;
    if (props.state === "disabled") el.disabled = true;
    else el.dataset.force = props.state;
  });
  return <div ref={cell}>{props.children}</div>;
};

const Controls: Component<{ theme: string }> = (props) => (
  <div
    class={css.scroll}
    tabindex="0"
    role="region"
    aria-label={`Controls in every state, ${props.theme}`}
  >
    <table class={css.states}>
      <thead>
        <tr>
          <td />
          <For each={STATES}>
            {(s) => (
              <th scope="col" class={kit.label}>
                {s}
              </th>
            )}
          </For>
        </tr>
      </thead>
      <tbody>
        <For each={CONTROLS}>
          {(c) => (
            <tr>
              <th scope="row" class={kit.small}>
                {c.name}
              </th>
              <For each={STATES}>
                {(s) => (
                  <td>
                    <Show when={!c.without?.includes(s)}>
                      <Specimen state={s}>{c.render()}</Specimen>
                    </Show>
                  </td>
                )}
              </For>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  </div>
);

// --- Surfaces --------------------------------------------------------------

const Surfaces: Component = () => (
  <RespondContexts>
    <div class={css.stack}>
      <div class={kit.card}>
        <p class={kit.label}>Card</p>
        <h3 class={kit.heading}>Results by role</h3>
        <p class={kit.text}>
          Body text on a card, with a{" "}
          <a class={kit.link} href="/design">
            link
          </a>{" "}
          and <span class={kit.code}>a1b2c3d4</span> in code.
        </p>
        <p class={kit.small}>Muted detail under it.</p>
      </div>

      <div class={css.row}>
        <span class={`${kit.chip} ${kit.chipOk}`}>Open</span>
        <span class={`${kit.chip} ${kit.chipAccent}`}>Sealed</span>
        <span class={kit.chip}>Ended</span>
        <span class={`${kit.chip} ${kit.chipDanger}`}>Cancelled</span>
        <span class={`${kit.chip} ${kit.chipGov}`}>Linked</span>
        <span class={`${kit.chip} ${kit.chipWarn}`}>Preview</span>
      </div>

      <div class={css.row}>
        <VisGlyph status="public" />
        <VisGlyph status="sealed" />
        <VisGlyph status="ended" />
        <VisGlyph status="cancelled" />
        <FormMosaic count={5} />
        <RoleChips roles={ROLE_VALUES} />
      </div>

      <Note kind="ok">Published: the survey is on chain.</Note>
      <Note kind="warn">
        The action's voting ends one epoch after the survey.
      </Note>
      <Note kind="danger">The anchor's hash doesn't match its content.</Note>

      <RespondedBanner role={Role.DRep} />
      <SealedBanner round={31287452} />
      <Notice
        tone="warn"
        title="This survey can't be counted"
        body="Its definition breaks a CIP-179 rule, so no response to it counts."
      />
      <Notice
        tone="muted"
        title="This survey has ended"
        body="It no longer takes responses. Its results are on the survey page."
      />

      <Ineligible def={SAMPLE} />

      <div class={kit.card}>
        <p class={kit.label}>Result bars</p>
        <Bars
          bars={[
            { label: "Scaling (Leios)", meta: "62%", pct: 0.62 },
            { label: "Governance polish", meta: "27%", pct: 0.27 },
            { label: "Developer tooling", meta: "11%", pct: 0.11 },
          ]}
        />
      </div>
    </div>
  </RespondContexts>
);

// --- Questions -------------------------------------------------------------

const Questions: Component = () => {
  const [drafts, setDrafts] = createStore<Draft[]>(
    SAMPLE.questions.map(initDraft),
  );
  const prompts: HTMLElement[] = [];
  return (
    <RespondContexts>
      <QuestionList
        questions={SAMPLE.questions}
        drafts={drafts}
        prompts={prompts}
        onChange={(i, value) => setDrafts(i, { value })}
        onSkip={(i, skipped) => setDrafts(i, { skipped })}
        onSeen={() => {}}
        pastLast={() => {}}
      />
    </RespondContexts>
  );
};
