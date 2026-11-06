/**
 * Lets a specimen show a pointer or focus state without the pointer or focus:
 * every rule of the page's sheets that names `:hover`, `:active` or
 * `:focus-visible` gets a twin matching `[data-force~="<state>"]` instead.
 * The twins live only on the page that calls this, so the app's own CSS never
 * mentions a showcase.
 */

const STATE = /:(hover|active|focus-visible)(?![\w-])/g;
const twinned = new WeakSet<CSSStyleSheet>();

function twin(group: CSSStyleSheet | CSSGroupingRule): void {
  const rules = [...group.cssRules];
  for (const rule of rules) {
    if (rule instanceof CSSStyleRule) {
      const selector = rule.selectorText.replace(STATE, '[data-force~="$1"]');
      if (selector === rule.selectorText) continue;
      group.insertRule(
        `${selector} { ${rule.style.cssText} }`,
        group.cssRules.length,
      );
    } else if (rule instanceof CSSGroupingRule) {
      twin(rule);
    }
  }
}

export function forceStates(): void {
  for (const sheet of document.styleSheets) {
    if (twinned.has(sheet)) continue;
    twinned.add(sheet);
    try {
      twin(sheet);
    } catch {
      // A sheet from another origin has unreadable rules; none of ours is one.
    }
  }
}
