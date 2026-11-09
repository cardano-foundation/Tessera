import { createEffect } from "solid-js";

/**
 * Names the page in the browser tab, the screen's own name first, while the
 * calling screen is mounted. Undefined while the name is still loading.
 */
export function usePageTitle(name: () => string | undefined): void {
  createEffect(() => {
    const n = name();
    document.title = n ? `${n} · Tessera` : "Tessera";
  });
}
