import type { Rect } from "./placement";

/** Padding between a spotlighted control and the cut-out's edge. */
export const SPOTLIGHT_PAD = 6;

function isVisible(el: Element) {
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== "hidden" && cs.display !== "none";
}

/** The first visible element marked `data-tour="id"`. A control can be rendered twice (a desktop
 * and a phone variant), and only the one on screen should be spotlighted. */
export function firstVisible(id: string, attr = "data-tour") {
  return Array.from(document.querySelectorAll(`[${attr}="${id}"]`)).find(isVisible) ?? null;
}

/** The control's box, padded, in viewport pixels. */
export function spotlightRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return {
    x: r.left - SPOTLIGHT_PAD,
    y: r.top - SPOTLIGHT_PAD,
    w: r.width + SPOTLIGHT_PAD * 2,
    h: r.height + SPOTLIGHT_PAD * 2,
    radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 8,
  };
}

/** The case page's selected tab, as its `data-tour` value (e.g. "tab-lawyer"). */
export function selectedCaseTab() {
  return document.querySelector('[role="tab"][aria-selected="true"]')?.getAttribute("data-tour") ?? null;
}
