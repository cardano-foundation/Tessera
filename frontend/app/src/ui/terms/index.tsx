/**
 * The terms of use and privacy policy at /terms. Legal prose is a document,
 * not interface copy: each locale writes it whole, links inline, in its own
 * module instead of catalog messages split around every link.
 */

import type { Component, JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

import { d, locale, t, type Locale } from "~/i18n";
import { usePageTitle } from "~/ui/pageTitle";
import kit from "~/ui/kit.module.css";
import { TermsEn } from "./en";
import { TermsFr } from "./fr";
import css from "./terms.module.css";

/** Midnight UTC of the day the text last changed in substance. */
const UPDATED = Date.UTC(2026, 10, 9) / 1000;

const BODIES: Record<Locale, Component> = { en: TermsEn, fr: TermsFr };

export default function Terms(): JSX.Element {
  usePageTitle(() => t("footer.terms"));
  return (
    <main class={css.main}>
      <h1 class={kit.pageTitle}>{t("footer.terms")}</h1>
      <p class={kit.small}>
        {t("footer.termsUpdated", {
          date: d(UPDATED, { dateStyle: "long", timeZone: "UTC" }),
        })}
      </p>
      <div class={css.body}>
        <Dynamic component={BODIES[locale()]} />
      </div>
    </main>
  );
}
