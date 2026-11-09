/**
 * The widget's design tokens, the defaults of its public --tessera-* custom
 * properties. Each colour is a [light, dark] pair, resolved against the
 * `color-scheme` the element inherits or is given; the widget sets none of
 * its own, so a page that declares nothing gets light, like a native control.
 *
 * The colours are the app's semantic tokens of the same names, which hold
 * the contrast pairs; the app's token test keeps the two equal.
 */

export const COLORS = {
  ink: ["#000629", "#f5f6fa"],
  body: ["#2b3147", "#e3e3e3"],
  muted: ["#5f6b85", "#a3a9bc"],
  card: ["#ffffff", "#1a1c2c"],
  sunken: ["#f3eee6", "#0b0d1c"],
  line: ["#e8e2d8", "#2c2f44"],
  "control-line": ["#7c8499", "#7a7f98"],
  accent: ["#0033ad", "#7a95da"],
  "accent-bg": ["#e8edf9", "#1f2a4d"],
  "accent-line": ["#b8c6ec", "#34457a"],
  "on-accent": ["#ffffff", "#000629"],
  ok: ["#1f6e3b", "#6fcf97"],
  "ok-bg": ["#e7f2ea", "#14302a"],
  "ok-line": ["#b9d8c3", "#2b5a44"],
  warn: ["#8a5a00", "#f0c040"],
  "warn-line": ["#ebcf96", "#5c4a18"],
  danger: ["#b3261e", "#ff8a80"],
  "danger-bg": ["#fbe9e7", "#3a1a1e"],
  "danger-line": ["#efc1bc", "#6a2e33"],
  "role-drep": ["#0033ad", "#8fb1ff"],
  "role-drep-bg": ["#e8edf9", "#1f2a4d"],
  "role-cc": ["#0069b4", "#0fb37b"],
  "role-cc-bg": ["#e5f0f9", "#0f2e25"],
  "role-spo": ["#c02a5f", "#ff8fb8"],
  "role-spo-bg": ["#fae8ee", "#3a1a2a"],
  "role-stakeholder": ["#6b3fa0", "#c4a5ff"],
  "role-stakeholder-bg": ["#f0eaf7", "#2a1f45"],
  "role-keyholder": ["#8a5a00", "#f0c040"],
  "role-keyholder-bg": ["#fbf0da", "#33290f"],
} as const satisfies Record<string, readonly [string, string]>;

/** Named, never loaded: a shadow root can't load webfonts for its host. */
export const FONTS = {
  sans: '"Chivo", "Chivo Variable", system-ui, sans-serif',
  mono: '"Chivo Mono", "Chivo Mono Variable", ui-monospace, monospace',
  serif: '"Newsreader", "Newsreader Variable", Georgia, serif',
} as const;

export const RADII = {
  "r-card": "18px",
  "r-md": "12px",
  "r-control": "11px",
  "r-sm": "9px",
  "r-chip": "8px",
  "r-xs": "7px",
  "r-3xs": "5px",
} as const;

const declare = (entries: [string, string][]): string =>
  entries.map(([name, value]) => `  --tessera-${name}: ${value};\n`).join("");

const colors = Object.entries(COLORS);

/**
 * The tokens as a :host rule, so they resolve inside the shadow root and a
 * host's rule on the element, or the `theme` prop's inline properties, beat
 * them. A browser without `light-dark()` would drop every colour, so it gets
 * the light values instead.
 */
export const tokenCss: string =
  `:host {\n` +
  declare(
    colors.map(([name, [light, dark]]) => [
      name,
      `light-dark(${light}, ${dark})`,
    ]),
  ) +
  declare(Object.entries(FONTS)) +
  declare(Object.entries(RADII)) +
  `}\n` +
  `@supports not (color: light-dark(#000, #fff)) {\n:host {\n` +
  declare(colors.map(([name, [light]]) => [name, light])) +
  `}\n}\n`;
