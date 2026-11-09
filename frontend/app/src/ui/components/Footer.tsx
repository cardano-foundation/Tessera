import { For, type Component } from "solid-js";

import { t } from "~/i18n";
import css from "./Footer.module.css";

export const REPOSITORY_URL = "https://github.com/cardano-foundation/Tessera";

/** Both open in a new tab, so a draft in progress here stays on screen. */
const LINKS = [
  { href: "/terms", label: () => t("footer.terms") },
  { href: REPOSITORY_URL, label: () => t("footer.source") },
];

export const Footer: Component = () => (
  <footer class={css.footer}>
    <div class={css.bar}>
      <For each={LINKS}>
        {(link) => (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            class={css.link}
            aria-label={t("footer.newTab", { label: link.label() })}
          >
            {link.label()}
            <NewTabIcon />
          </a>
        )}
      </For>
    </div>
  </footer>
);

const NewTabIcon: Component = () => (
  <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
    <path
      d="M5 2H2.5a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V7M7 2h3v3M10 2 5.5 6.5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);
