/**
 * The terms of use and privacy policy at /terms. English only, whatever the
 * interface language: it is the only version legal review covers.
 */

import type { JSX } from "solid-js";

import { REPOSITORY_URL } from "~/ui/components/Footer";
import { usePageTitle } from "~/ui/pageTitle";
import { REPORT_EMAIL } from "~/ui/report";
import kit from "~/ui/kit.module.css";
import css from "./terms.module.css";

const FOUNDATION_TERMS_URL =
  "https://cardanofoundation.org/policy/terms-and-conditions";
const VERCEL_PRIVACY_URL = "https://vercel.com/legal/privacy-policy";
const FOUNDATION_PRIVACY_URL = "https://cardanofoundation.org/policy/privacy";
const PRIVACY_EMAIL = "privacy@cardanofoundation.org";

export default function Terms(): JSX.Element {
  usePageTitle(() => "Terms and privacy");
  return (
    <main class={css.main} lang="en">
      <h1 class={kit.pageTitle}>Terms and privacy</h1>
      <p class={kit.small}>Last updated November 9, 2026</p>
      <div class={css.body}>
        <p>
          Tessera is a website to create, browse, and answer surveys published
          on the Cardano blockchain, operated by Cardano Stiftung (Cardano
          Foundation). By using it, you agree to these terms and to the Cardano
          Foundation's general{" "}
          <a class={kit.link} href={FOUNDATION_TERMS_URL}>
            Terms of Use
          </a>
          . Where the two differ, these terms prevail.
        </p>

        <h2>Terms of use</h2>
        <ul>
          <li>
            <b>Publication.</b> Surveys and responses are published on the
            Cardano blockchain, where anyone can read them and no one, including
            us, can change or remove them. Do not include personal or
            confidential information.
          </li>
          <li>
            <b>Sealed surveys.</b> A sealed response is encrypted only until the
            survey's reveal date. After that, anyone can read it.
          </li>
          <li>
            <b>Your wallet.</b> Tessera never holds your keys or funds. Your
            wallet signs and submits each transaction, and fees cannot be
            refunded.
          </li>
          <li>
            <b>Content from others.</b> Anyone can publish a survey. We do not
            review surveys, the documents they link to, or their responses
            before they appear, and we do not endorse them.
          </li>
          <li>
            <b>Reporting content.</b> To report content you believe is unlawful,
            use the Report link next to it or write to{" "}
            <a class={kit.link} href={`mailto:${REPORT_EMAIL}`}>
              {REPORT_EMAIL}
            </a>
            . We stop showing content on this website when it is clearly
            unlawful, such as personal data about someone else, content a court
            or authority ordered removed, or illegal material. We do not hide
            content because someone disagrees with it, a decision can be
            reversed, and hidden content remains on the blockchain.
          </li>
          <li>
            <b>Open source and open data.</b> Tessera is open source under the
            Apache License 2.0,{" "}
            <a class={kit.link} href={REPOSITORY_URL}>
              on GitHub
            </a>
            . Anyone may read, copy, and recompute surveys, responses, and
            results, including with programs through this website's API. The
            general Terms of Use's restrictions on copying, data mining, and
            scraping do not apply to the software or to this data.
          </li>
          <li>
            <b>No warranty.</b> This website is provided "as is", without
            warranty, and may change or stop at any time. To the extent
            permitted by law, the Cardano Foundation is not liable for any loss
            arising from its use.
          </li>
        </ul>

        <h2>Privacy policy</h2>
        <p>
          Cardano Stiftung (Cardano Foundation), Dammstrasse 16, 6300 Zug,
          Switzerland, is responsible for personal data processed by this
          website.
        </p>
        <ul>
          <li>
            <b>No account.</b> We do not ask for your name or email. Your
            settings, drafts, and access tokens are kept in your browser and
            never sent to our server.
          </li>
          <li>
            <b>What is public.</b> Everything you publish, and when. A response
            is linked to the credential of the role you answer as, such as DRep,
            and to the wallet that paid for it. Its content can also identify
            you.
          </li>
          <li>
            <b>Our server.</b> It keeps a copy of public blockchain data. Our
            host,{" "}
            <a class={kit.link} href={VERCEL_PRIVACY_URL}>
              Vercel
            </a>
            , processes your IP address to run and secure the website and keeps
            logs for a few days at most. We use no cookies and no analytics.
          </li>
          <li>
            <b>Other services.</b> Your browser also contacts your wallet, the
            drand network for sealed surveys, IPFS gateways and websites linked
            by surveys, and any service you configure in Settings. They see your
            IP address and apply their own privacy policies.
          </li>
          <li>
            <b>Legal basis.</b> We process personal data under the Swiss Federal
            Act on Data Protection (FADP) and, where the GDPR applies, on the
            basis of our legitimate interest in operating this website (Article
            6(1)(f) GDPR).
          </li>
        </ul>

        <h2>Your rights</h2>
        <p>
          For your data protection rights and how to exercise them, see the
          Cardano Foundation{" "}
          <a class={kit.link} href={FOUNDATION_PRIVACY_URL}>
            Privacy Policy
          </a>{" "}
          or write to{" "}
          <a class={kit.link} href={`mailto:${PRIVACY_EMAIL}`}>
            {PRIVACY_EMAIL}
          </a>
          . No one can change or remove what is recorded on the blockchain.
        </p>
      </div>
    </main>
  );
}
