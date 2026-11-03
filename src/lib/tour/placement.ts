import type { Placement } from "./tours";

/** The spotlight's box in viewport pixels, already padded around the target. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
}

export const CARD_WIDTH = 300;
const GAP = 16;
const EDGE = 16;
/** Room kept clear at the bottom for the control bar. */
const BAR_ROOM = 96;

/** Where the step card goes on desktop: the step's preferred side if it fits, else any side that
 * does, else docked to the screen edge with more room: never on top of the target. */
export function placeCard(r: Rect, cardH: number, preferred: Placement, W: number, H: number) {
  const fits: Record<Placement, boolean> = {
    bottom: r.y + r.h + GAP + cardH <= H - BAR_ROOM,
    top: r.y - GAP - cardH >= EDGE,
    left: r.x - GAP - CARD_WIDTH >= EDGE,
    right: r.x + r.w + GAP + CARD_WIDTH <= W - EDGE,
  };
  const side = fits[preferred] ? preferred : (["bottom", "top", "right", "left"] as const).find((p) => fits[p]);

  if (!side) {
    const dockBottom = H - BAR_ROOM - (r.y + r.h) >= r.y - EDGE;
    const left = r.x + r.w / 2 < W / 2 ? W - CARD_WIDTH - EDGE : EDGE;
    return { left, top: dockBottom ? H - BAR_ROOM - cardH : EDGE };
  }

  let left: number;
  let top: number;
  if (side === "bottom" || side === "top") {
    left = r.x + r.w / 2 - CARD_WIDTH / 2;
    top = side === "bottom" ? r.y + r.h + GAP : r.y - GAP - cardH;
  } else {
    top = r.y + r.h / 2 - cardH / 2;
    left = side === "left" ? r.x - GAP - CARD_WIDTH : r.x + r.w + GAP;
  }
  left = Math.max(EDGE, Math.min(W - CARD_WIDTH - EDGE, left));
  top = Math.max(EDGE, Math.min(H - BAR_ROOM - cardH, top));
  return { left, top };
}

/** On a phone the card is a sheet: at the top when the target is in the lower half of the
 * screen, otherwise just above the control bar. */
export function sheetAtTop(r: Rect, H: number) {
  return r.y + r.h / 2 > H / 2;
}

/** Whether two spotlight boxes differ enough to re-render (sub-pixel jitter is ignored). */
export function rectMoved(a: Rect | null, b: Rect) {
  return !a || Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5 || Math.abs(a.w - b.w) > 0.5 || Math.abs(a.h - b.h) > 0.5;
}
