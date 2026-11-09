import type { Component } from "solid-js";
import { A } from "@solidjs/router";

import { t } from "~/i18n";
import css from "./Footer.module.css";

export const REPOSITORY_URL = "https://github.com/cardano-foundation/Tessera";

export const Footer: Component = () => (
  <footer class={css.footer}>
    <div class={css.bar}>
      <A href="/terms" class={css.link}>
        {t("footer.terms")}
      </A>
      <a href={REPOSITORY_URL} class={css.link}>
        {t("footer.source")}
      </a>
    </div>
  </footer>
);
