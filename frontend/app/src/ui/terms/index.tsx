/**
 * The terms of use and privacy policy at /terms. English only, whatever the
 * interface language: it is the only version legal review covers.
 */

import type { JSX } from "solid-js";

import { REPOSITORY_URL } from "~/ui/components/Footer";
import { usePageTitle } from "~/ui/pageTitle";
import kit from "~/ui/kit.module.css";
import css from "./terms.module.css";

const FOUNDATION_TERMS_URL =
  "https://cardanofoundation.org/policy/terms-and-conditions";
const VERCEL_PRIVACY_URL = "https://vercel.com/legal/privacy-policy";
const PRIVACY_EMAIL = "privacy@cardanofoundation.org";

export default function Terms(): JSX.Element {
  usePageTitle(() => "Terms and privacy");
  return (
    <main class={css.main} lang="en">
      <h1 class={kit.pageTitle}>Terms and privacy</h1>
      <p class={kit.small}>Last updated November 9, 2026</p>
      <div class={css.body}>
        <p>
          Tessera is a website to create, browse, and answer surveys and polls
          published on the Cardano blockchain. It is operated by Cardano
          Stiftung (Cardano Foundation). By using it, you agree to these terms
          and to the Cardano Foundation's general{" "}
          <a class={kit.link} href={FOUNDATION_TERMS_URL}>
            Terms of Use
          </a>
          , which also apply to this website. Where the two differ, these terms
          prevail.
        </p>

        <h2>Terms of use</h2>
        <ul>
          <li>
            <b>Publication.</b> Surveys and responses are published on the
            Cardano blockchain, where anyone can read them and no one, including
            us, can change or remove them. Do not include personal information
            about yourself or others, such as names, email addresses, or other
            identifying details, or any confidential information.
          </li>
          <li>
            <b>Sealed surveys.</b> A sealed response is encrypted only until the
            survey's reveal date. After that date, anyone can read it.
          </li>
          <li>
            <b>Your wallet.</b> Tessera never holds your keys or funds.
            Transactions are built in your browser, then signed and submitted by
            your wallet. Network fees paid for a transaction cannot be refunded.
            Check every transaction before you sign it.
          </li>
          <li>
            <b>Content from others.</b> Anyone can publish a survey. We do not
            write, review, or endorse the surveys shown here, the documents they
            link to, or the responses they receive.
          </li>
          <li>
            <b>Open source and open data.</b> The Tessera software is open
            source under the Apache License 2.0 and available{" "}
            <a class={kit.link} href={REPOSITORY_URL}>
              on GitHub
            </a>
            . Surveys, responses, and results are public blockchain data: anyone
            may read, copy, and recompute them, by hand or with programs,
            including through this website's API. The general Terms of Use's
            restrictions on copying, text and data mining, and web scraping do
            not apply to the software or to this data.
          </li>
          <li>
            <b>No warranty.</b> This website is provided "as is", without
            warranty of any kind, and may change or be unavailable at any time.
            Results are provided for information only. To the extent permitted
            by law, the Cardano Foundation is not liable for any loss arising
            from the use of this website.
          </li>
        </ul>

        <h2>Privacy policy</h2>
        <p>
          Cardano Stiftung (Cardano Foundation), Dammstrasse 16, 6300 Zug,
          Switzerland, is responsible for the processing of personal data in
          connection with this website.
        </p>

        <h3>What we collect</h3>
        <p>
          There is no account, and we do not ask for your name or email address.
          Until you publish it, what you enter stays in your browser.
        </p>

        <h3>What is public</h3>
        <p>
          Everything you publish is public on the Cardano blockchain, together
          with when it was published. To answer a survey, you prove that you
          hold a role, such as DRep or stake pool operator, so your response is
          linked to that role's public credential and to the wallet that paid
          for the transaction. A text answer, or your answers taken together,
          can also be enough to recognize you. Please consider carefully what
          you publish.
        </p>

        <h3>What stays in your browser</h3>
        <p>
          Your settings, drafts, and pending transactions, and any access tokens
          you enter for IPFS pinning or Koios, are kept in your browser's local
          storage. They are never sent to our server. A token is only sent to
          the service it belongs to.
        </p>

        <h3>What our server keeps</h3>
        <p>
          Our server keeps a copy of the public blockchain data that Tessera
          displays. Our host,{" "}
          <a class={kit.link} href={VERCEL_PRIVACY_URL}>
            Vercel
          </a>
          , processes your IP address to operate and secure the website, and
          keeps our server's logs for a few days at most. We use no cookies and
          no analytics.
        </p>

        <h3>Services your browser contacts</h3>
        <p>
          Some features make your browser contact other services directly. They
          see your IP address and apply their own privacy policies: your wallet;
          the drand network, for sealed surveys; public IPFS gateways and the
          web addresses chosen by survey authors, to display linked documents;
          the IPFS pinning services you configure, to upload documents; and
          Koios, when Tessera reads the blockchain without our server.
        </p>

        <h3>Legal basis</h3>
        <p>
          To the extent that personal data is processed in connection with this
          website, we do so in accordance with the Swiss Federal Act on Data
          Protection (FADP) and, where the GDPR applies, rely on our legitimate
          interests in operating this website under Article 6(1)(f) GDPR.
        </p>

        <h2>Your data protection rights</h2>
        <p>
          You may have certain rights regarding your personal data under
          applicable data protection laws. For more information about how we
          process personal data, your rights, and how to exercise them, see the
          Cardano Foundation Privacy Policy or contact us at{" "}
          <a class={kit.link} href={`mailto:${PRIVACY_EMAIL}`}>
            {PRIVACY_EMAIL}
          </a>
          . Note that no one can change or remove what is recorded on the
          blockchain.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms. The date at the top of this page shows when
          they last changed.
        </p>
      </div>
    </main>
  );
}
