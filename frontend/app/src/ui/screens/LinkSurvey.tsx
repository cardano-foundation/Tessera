/**
 * Link a survey to a governance action — the one tool for the whole flow:
 * produce the linked CIP-108 document (from a minimal form, or by inserting
 * the link into a document from external governance tooling), host its exact
 * bytes, and build/sign/submit the Conway **Info Action** carrying it (the one
 * action kind Tessera submits itself).
 *
 * The survey arrives by reference from the route (`/survey/:key/link`), so the
 * link target is fixed before any document exists — the tool never trusts a
 * pasted ref.
 */

import {
  Show,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  createUniqueId,
  untrack,
  type Component,
} from "solid-js";
import { A, useParams } from "@solidjs/router";
import type { SurveyRef } from "cip-179";

import {
  hexToBytes,
  parseRefKey,
  refKey,
  type SurveyRefLite,
} from "cip-179/domain";

import { useApp } from "~/state";
import {
  anchorFromText,
  buildLinkedAnchor,
  computeAlignment,
  injectSurveyLink,
  type InjectResult,
  type LoadedAnchor,
} from "~/domain/anchorLink";
import {
  LinkAnchorSection,
  type PreparedAnchor,
} from "~/ui/components/LinkAnchorSection";
import linkCss from "~/ui/components/LinkAnchorSection.module.css";
import { TxLink } from "~/ui/components/TxLink";
import { CopyButton } from "~/ui/components/CopyButton";
import { Note } from "~/ui/components/Note";
import { Empty, type EmptyText } from "~/ui/components/Empty";
import { PublishLocked, QueuedNote } from "~/ui/components/CartDrawer";
import { networkMismatch } from "~/ui/format";
import type { Action } from "~/wallet/action";
import { t } from "~/i18n";
import kit from "~/ui/kit.module.css";
import css from "./LinkSurvey.module.css";
import { usePageTitle } from "~/ui/pageTitle";

const refusalText = (r: Exclude<InjectResult, { ok: true }>): string => {
  switch (r.reason) {
    case "notJson":
      return t("linkSurvey.refusalNotJson", { message: r.detail });
    case "notObject":
      return t("linkSurvey.refusalNotObject");
    case "noBody":
      return t("linkSurvey.refusalNoBody");
    case "noContext":
      return t("linkSurvey.refusalNoContext");
    case "alreadyLinked":
      return r.linkedRef
        ? t("linkSurvey.refusalAlreadyLinkedTo", {
            ref: refKey(r.linkedRef),
          })
        : t("linkSurvey.refusalAlreadyLinked");
  }
};

export const LinkSurvey: Component = () => {
  const app = useApp();
  const params = useParams<{ key: string }>();
  const key = () => decodeURIComponent(params.key);

  // The route's "txHex:index" as the two ref shapes downstream code wants:
  // bytes for the bundle fetch, lowercased hex for the document layer.
  const refLite = createMemo<SurveyRefLite | null>(() =>
    parseRefKey(key().toLowerCase()),
  );
  const ref = (): SurveyRef | undefined => {
    const r = refLite();
    return r ? { txId: hexToBytes(r.txId), index: r.index } : undefined;
  };

  // The survey's own bundle, fetched by exact reference — the paginated list
  // snapshot may simply not contain this survey.
  const [bundle, { refetch }] = createResource(ref, (r) =>
    app.source.surveyBundle(r),
  );
  const retryBundle = (): void => {
    void Promise.resolve(refetch()).catch(() => {});
  };
  const def = () => (bundle.error ? undefined : bundle())?.survey.definition;
  usePageTitle(() => t("linkSurvey.title"));

  // Alignment is fixed by the route: it depends on the survey's end epoch and
  // the tip, never on the document, so it's judged before any document exists.
  const alignment = createMemo(() =>
    computeAlignment({
      hasLink: true,
      tip: (bundle.error ? undefined : bundle())?.tip,
      surveyEndEpoch: def()?.endEpoch,
      secondsPerEpoch: app.config.secondsPerEpoch,
    }),
  );

  // --- Step 1: the document, by form or by upload -------------------------
  type Entry = "ask" | "form" | "upload";
  const [entry, setEntry] = createSignal<Entry>("ask");
  const [anchor, setAnchor] = createSignal<LoadedAnchor | null>(null);
  const [strippedAuthors, setStrippedAuthors] = createSignal(false);
  const [uploadError, setUploadError] = createSignal<string | null>(null);

  const [title, setTitle] = createSignal("");
  const [abstract, setAbstract] = createSignal("");
  const [motivation, setMotivation] = createSignal("");
  const [rationale, setRationale] = createSignal("");
  const titleHintId = createUniqueId();
  const uploadHintId = createUniqueId();
  const formComplete = () =>
    [title(), abstract(), motivation(), rationale()].every(
      (v) => v.trim() !== "",
    );

  const startOver = () => {
    setEntry("ask");
    setAnchor(null);
    setStrippedAuthors(false);
    setUploadError(null);
  };

  const generate = () => {
    const r = refLite();
    if (!r || !formComplete()) return;
    const text = buildLinkedAnchor(
      {
        title: title().trim(),
        abstract: abstract().trim(),
        motivation: motivation().trim(),
        rationale: rationale().trim(),
      },
      r,
    );
    setStrippedAuthors(false);
    setAnchor(anchorFromText(`survey-link-${r.txId.slice(0, 8)}.jsonld`, text));
  };

  const loadFile = async (file: File | undefined) => {
    const r = refLite();
    if (!file || !r) return;
    setUploadError(null);
    const res = injectSurveyLink(await file.text(), r);
    if (!res.ok) {
      setAnchor(null);
      setStrippedAuthors(false);
      setUploadError(refusalText(res));
      return;
    }
    setStrippedAuthors(res.strippedAuthors);
    setAnchor(anchorFromText(file.name, res.text));
  };

  // --- Steps 2–3: host, then sign & submit --------------------------------
  const [prepared, setPrepared] = createSignal<PreparedAnchor | null>(null);
  const [busy, setBusy] = createSignal(false);
  const [txHash, setTxHash] = createSignal<string | null>(null);
  const [queued, setQueued] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // A different document invalidates a previous submission's outcome — clear
  // the stale success/error notes (url/pin edits keep the same document).
  const onPrepared = (p: PreparedAnchor | null) => {
    if (p?.anchor.hashHex !== prepared()?.anchor.hashHex) {
      setTxHash(null);
      setQueued(false);
      setError(null);
    }
    setPrepared(p);
  };
  // The document went away (a refused upload): the prepared state goes too.
  createEffect(() => {
    if (!anchor()) untrack(() => onPrepared(null));
  });

  const mismatch = () =>
    networkMismatch(app.wallet()?.identity.networkId, app.config.network);

  const blocking = () => {
    const p = prepared();
    return !p || p.blocking || !p.urlValid;
  };

  // Queuing needs no wallet — only publishing does.
  const canQueue = () => !!prepared() && !blocking() && !busy();
  const canSubmit = () => canQueue() && !!app.wallet() && !mismatch();
  // With something already waiting, publishing would publish that too — so the
  // button queues instead, and the cart is where it all goes out.
  const queueing = () => app.cart().length > 0;

  const proposal = (p: PreparedAnchor): Action => {
    const r = p.surveyRef;
    return {
      kind: "govAction",
      anchorUrl: p.url,
      anchorDataHash: p.anchor.hash,
      surveyKey: r ? refKey(r) : undefined,
      title: p.linkedSurveyTitle,
      proveCredentials: [],
    };
  };

  const queue = () => {
    const p = prepared();
    if (!p || !canQueue()) return;
    app.enqueue([proposal(p)]);
    setQueued(true);
  };

  const submit = async () => {
    const p = prepared();
    if (!p || !canSubmit()) return;
    setBusy(true);
    setError(null);
    try {
      const hashes = await app.submitOrQueue([proposal(p)]);
      if (hashes) setTxHash(hashes[0] ?? null);
      else setQueued(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main class={css.main}>
      <A href={`/survey/${encodeURIComponent(key())}`} class={kit.back}>
        {t("linkSurvey.backToSurvey")}
      </A>

      <div class={css.titleRow}>
        <span class={`${kit.chip} ${kit.chipGov}`}>
          {t("linkSurvey.govPill")}
        </span>
        <h1 class={kit.pageTitle}>{t("linkSurvey.title")}</h1>
      </div>
      <p class={`${kit.text} ${css.lead}`}>
        {t("linkSurvey.leadPre")}
        <b>Info Action</b>
        {t("linkSurvey.leadPost")}
      </p>

      <Show
        when={refLite() && def()}
        fallback={
          <Empty
            loading={bundle.loading}
            error={refLite() ? bundle.error : undefined}
            onRetry={retryBundle}
            text={emptyText(refLite() !== null)}
          />
        }
      >
        {/* The survey being linked, and whether a link can still form. */}
        <div class={`${kit.card} ${linkCss.card}`}>
          <div class={`${kit.label} ${linkCss.label}`}>
            {t("linkSurvey.linkingLabel")}
          </div>
          <div class={css.surveyTitle}>
            {def()!.title || t("linkSurvey.untitledSurvey")}
          </div>
          <div class={linkCss.surveyRef}>
            {refLite()!.txId}
            <span class={linkCss.refIndex}>
              {t("linkSurvey.refIndex", { index: refLite()!.index })}
              {" · "}
              {t("linkSurvey.endEpochLine", { endEpoch: def()!.endEpoch })}
            </span>
          </div>
          {/* A CIP-108 link carries these as two fields, surveyTxId and
              surveyIndex, so each is copied on its own. */}
          <div class={linkCss.actionRow}>
            <CopyButton
              text={refLite()!.txId}
              label={t("linkSurvey.copyTxId")}
              copiedLabel={t("linkSurvey.copiedTxId")}
              class={kit.button}
            />
            <CopyButton
              text={String(refLite()!.index)}
              label={t("linkSurvey.copyIndex")}
              copiedLabel={t("linkSurvey.copiedIndex")}
              class={kit.button}
            />
          </div>
          <Show when={alignment()}>
            {(a) => (
              <Note kind={a().level} style={{ "margin-top": "12px" }}>
                {a().text}
              </Note>
            )}
          </Show>
        </div>

        {/* 1 · The document */}
        <h2 class={linkCss.stepHead}>{t("linkSurvey.step1Head")}</h2>
        <div class={`${kit.card} ${linkCss.card}`}>
          <Show when={entry() === "ask"}>
            <p class={`${kit.text} ${css.flush}`}>
              {t("linkSurvey.entryQuestion")}
            </p>
            <div class={css.choiceRow}>
              <button
                type="button"
                class={css.choiceBtn}
                onClick={() => setEntry("form")}
              >
                <span class={css.choiceTitle}>
                  {t("linkSurvey.entryFromScratch")}
                </span>
                <span class={kit.small}>
                  {t("linkSurvey.entryFromScratchHint")}
                </span>
              </button>
              <button
                type="button"
                class={css.choiceBtn}
                onClick={() => setEntry("upload")}
              >
                <span class={css.choiceTitle}>
                  {t("linkSurvey.entryUpload")}
                </span>
                <span class={kit.small}>{t("linkSurvey.entryUploadHint")}</span>
              </button>
            </div>
          </Show>

          <Show when={entry() === "form"}>
            <label class={css.formField}>
              <span class={kit.fieldLabel}>{t("linkSurvey.formTitle")}</span>
              <input
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
                aria-describedby={titleHintId}
                class={kit.field}
              />
            </label>
            <p id={titleHintId} class={kit.fieldHint}>
              {t("linkSurvey.formTitleHint")}
            </p>
            <label class={css.formField}>
              <span class={kit.fieldLabel}>{t("linkSurvey.formAbstract")}</span>
              <textarea
                value={abstract()}
                onInput={(e) => setAbstract(e.currentTarget.value)}
                class={`${kit.field} ${css.formArea}`}
              />
            </label>
            <label class={css.formField}>
              <span class={kit.fieldLabel}>
                {t("linkSurvey.formMotivation")}
              </span>
              <textarea
                value={motivation()}
                onInput={(e) => setMotivation(e.currentTarget.value)}
                class={`${kit.field} ${css.formArea}`}
              />
            </label>
            <label class={css.formField}>
              <span class={kit.fieldLabel}>
                {t("linkSurvey.formRationale")}
              </span>
              <textarea
                value={rationale()}
                onInput={(e) => setRationale(e.currentTarget.value)}
                class={`${kit.field} ${css.formArea}`}
              />
            </label>
            <div class={linkCss.actionRow}>
              <button
                type="button"
                onClick={generate}
                disabled={!formComplete()}
                class={`${kit.button} ${kit.primary}`}
              >
                {t("linkSurvey.formGenerate")}
              </button>
            </div>
            <button
              type="button"
              class={`${kit.button} ${kit.quiet} ${css.startOver}`}
              onClick={startOver}
            >
              {t("linkSurvey.entryChange")}
            </button>
          </Show>

          <Show when={entry() === "upload"}>
            <p class={`${kit.small} ${css.flush}`} id={uploadHintId}>
              {t("linkSurvey.uploadHintPre")}
              <span class={kit.code}>.jsonld</span>
              {t("linkSurvey.uploadHintMid")}
              <span class={kit.code}>body.cip179</span>
              {t("linkSurvey.uploadHintPost")}
            </p>
            <input
              type="file"
              aria-describedby={uploadHintId}
              accept=".jsonld,.json,application/ld+json,application/json"
              onChange={(e) => {
                void loadFile(e.currentTarget.files?.[0]);
                // Allow re-loading the same filename after an edit on disk.
                e.currentTarget.value = "";
              }}
              class={css.fileInput}
            />
            <Show when={uploadError()}>
              <Note kind="danger" style={{ "margin-top": "12px" }}>
                {uploadError()}
              </Note>
            </Show>
            <Show when={anchor() && strippedAuthors()}>
              <Note kind="warn" style={{ "margin-top": "12px" }}>
                {t("linkSurvey.strippedAuthors")}
              </Note>
            </Show>
            <button
              type="button"
              class={`${kit.button} ${kit.quiet} ${css.startOver}`}
              onClick={startOver}
            >
              {t("linkSurvey.entryChange")}
            </button>
          </Show>
        </div>

        {/* 2 · Host the exact bytes, collect the anchor URL. */}
        <Show when={anchor()}>
          {(a) => (
            <>
              <LinkAnchorSection
                anchor={a()}
                surveyTitle={def()?.title || undefined}
                misaligned={alignment()?.level === "danger"}
                onChange={onPrepared}
              />

              {/* 3 · Info-Action-specific: sign & submit. */}
              <h2 class={linkCss.stepHead}>{t("linkSurvey.step3Head")}</h2>
              <p class={`${kit.small} ${css.sectionNote}`}>
                {t("linkSurvey.submitSectionNote")}
              </p>
              <div class={`${kit.card} ${linkCss.card}`}>
                <Show
                  when={app.wallet()}
                  fallback={
                    <Note kind="warn">{t("linkSurvey.connectWallet")}</Note>
                  }
                >
                  <Show when={mismatch()}>
                    <Note kind="danger">
                      {t("linkSurvey.networkMismatch", {
                        network: app.config.network,
                      })}
                    </Note>
                  </Show>
                </Show>

                <Show when={prepared() && blocking() && !txHash()}>
                  <Note kind="danger">{t("linkSurvey.resolveIssues")}</Note>
                </Show>

                <Show when={queued()}>
                  <QueuedNote />
                </Show>

                <Show
                  when={txHash()}
                  fallback={
                    <Show when={!queued()}>
                      <Show
                        when={!app.cartLocked()}
                        fallback={<PublishLocked />}
                      >
                        <div class={css.submitRow}>
                          <button
                            type="button"
                            onClick={() =>
                              queueing() ? queue() : void submit()
                            }
                            disabled={queueing() ? !canQueue() : !canSubmit()}
                            class={`${kit.button} ${queueing() ? kit.primary : kit.cta}`}
                          >
                            {busy()
                              ? t("linkSurvey.building")
                              : queueing()
                                ? t("cart.addToCart")
                                : t("linkSurvey.submit")}
                          </button>
                          <Show when={!queueing()}>
                            <button
                              type="button"
                              onClick={() => queue()}
                              disabled={!canQueue()}
                              class={kit.button}
                            >
                              {t("cart.addToCart")}
                            </button>
                          </Show>
                        </div>
                      </Show>
                    </Show>
                  }
                >
                  {(h) => (
                    <Note kind="ok">
                      <div class={css.submittedTitle}>
                        {t("linkSurvey.submittedTitle")}
                      </div>
                      <div class={css.txLine}>
                        <TxLink hash={h()} color="var(--ok)" />
                      </div>
                      <p class={css.submittedHint}>
                        {t("linkSurvey.submittedHint")}
                      </p>
                    </Note>
                  )}
                </Show>

                <Show when={error()}>
                  <Note kind="danger">{error()}</Note>
                </Show>
              </div>
            </>
          )}
        </Show>
      </Show>
    </main>
  );
};

const emptyText = (validKey: boolean): EmptyText => ({
  loading: t("linkSurvey.loadingSurvey"),
  notFound: validKey ? t("linkSurvey.surveyNotFound") : t("linkSurvey.badKey"),
  error: t("linkSurvey.surveyLoadFailed"),
  retry: t("linkSurvey.retry"),
});
