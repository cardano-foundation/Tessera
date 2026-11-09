import {
  Show,
  createEffect,
  onCleanup,
  type JSX,
  type ParentComponent,
} from "solid-js";

import { useApp, type HeaderMenu } from "~/state";

/**
 * A header button and the panel it opens. At most one header menu is open (the
 * app's `openMenu`); a press outside closes it, and so does Escape, which
 * returns focus to the button. The panel positions itself: the nearest
 * positioned ancestor is its containing block.
 */
export const Menu: ParentComponent<{
  id: HeaderMenu;
  button: JSX.Element;
  buttonClass: string;
  /** Overrides the button's text as its name, for an icon or a terse label. */
  label?: string;
  panelClass: string;
}> = (props) => {
  const app = useApp();
  const open = () => app.openMenu() === props.id;
  let wrap!: HTMLDivElement;
  let button!: HTMLButtonElement;

  createEffect(() => {
    if (!open()) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrap.contains(e.target as Node)) app.setOpenMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      app.setOpenMenu(null);
      button.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    });
  });
  // A menu whose button goes away (the cart emptied) must not reopen with it.
  onCleanup(() => {
    if (open()) app.setOpenMenu(null);
  });

  return (
    <div ref={wrap}>
      <button
        ref={button}
        type="button"
        class={props.buttonClass}
        aria-label={props.label}
        aria-expanded={open()}
        onClick={() => app.setOpenMenu(open() ? null : props.id)}
      >
        {props.button}
      </button>
      <Show when={open()}>
        <div class={props.panelClass}>{props.children}</div>
      </Show>
    </div>
  );
};
