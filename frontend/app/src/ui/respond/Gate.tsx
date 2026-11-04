/**
 * Who may answer, and what stands in for the form when they may not. Every
 * refusal renders a {@link Notice} — the same card the screen uses for its own
 * warnings — so a voter meets one shape whatever turned them away.
 */

import { Show, type Component, type JSX } from "solid-js";
import type { Role } from "cip-179";
import type { SurveyAggregate } from "cip-179/domain";
import { Ineligible, Notice } from "cardano-tessera-respond-ui";

import { viewStatus } from "~/ui/format";
import { t } from "~/i18n";

/** Renders the form (children) only when open, public, connected, and eligible. */
export const FormGate: Component<{
  s: SurveyAggregate;
  connected: boolean;
  respondable: Role[];
  children: JSX.Element;
}> = (props) => {
  const v = () => viewStatus(props.s);
  // Both "public" and "sealed" are open/active — sealed just encrypts on submit.
  return (
    <Show
      when={v() === "public" || v() === "sealed"}
      fallback={<ClosedNotice v={v()} />}
    >
      <Show when={props.connected} fallback={<ConnectPrompt />}>
        <Show
          when={props.respondable.length > 0}
          fallback={<Ineligible def={props.s.record.definition} />}
        >
          {props.children}
        </Show>
      </Show>
    </Show>
  );
};

const ClosedNotice: Component<{ v: ReturnType<typeof viewStatus> }> = (
  props,
) => (
  <Notice
    tone="muted"
    title={
      props.v === "invalid"
        ? t("respond.untalliableTitle")
        : props.v === "cancelled"
          ? t("respond.closedCancelledTitle")
          : t("respond.closedTitle")
    }
    body={
      props.v === "invalid"
        ? t("respond.untalliableBody")
        : props.v === "cancelled"
          ? t("respond.closedCancelledBody")
          : t("respond.closedBody")
    }
  />
);

const ConnectPrompt: Component = () => (
  <Notice
    tone="muted"
    title={t("respond.connectTitle")}
    body={t("respond.connectBody")}
  />
);
