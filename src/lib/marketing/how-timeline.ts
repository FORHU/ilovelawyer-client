// The "How it works" scroll story as plain maths. `d` is how far the section has scrolled, in
// viewport heights: -1 when its top reaches the bottom of the screen, 0 when it fills the screen.
// howPose says where everything sits at a given d; the view only applies it.

import { clamp01, easeOutCubic as ease } from "./hero-geometry";

export interface HowLayout {
  W: number;
  H: number;
  mob: boolean;
  /** The height of a step's heading, which the laptop leaves room for. */
  headingH: number;
  /** The widths of the two halves of "Stop guessing / what it means." */
  leftW: number;
  rightW: number;
}

/** Where "How it works" links land, in d: the opening line is fully in and not yet leaving. */
export const HOW_OPENING_D = 0.7;

/** Each heading's [start fading in, fully in, start fading out, gone], in d. */
export const HOW_HEADINGS: { text: string; at: [number, number, number, number]; over?: boolean }[] = [
  { text: "Start on your phone. Pick up on your desktop.", at: [1.42, 1.72, 1.95, 2.1] },
  { text: "Your case, briefed. Solicitors, ready.", at: [2.1, 2.3, 2.75, 2.9] },
  { text: "Get quotes from verified UK solicitors.", at: [3.0, 3.2, 3.65, 3.8] },
  { text: "Choose who you trust. Every solicitor is SRA verified.", at: [3.85, 4.05, 4.45, 4.6] },
  { text: "Talk to your solicitor in one place.", at: [4.65, 4.85, 5.25, 5.4] },
  { text: "Upload a letter. See what it means.", at: [5.45, 5.65, 6.0, 6.15] },
  // Stays to the end: the terminal scrolls away with it, straight into the next section.
  { text: "Behind every answer, a solicitor with serious tools.", at: [6.3, 6.5, 98, 99], over: true },
];

export const TERMINAL_CAPTIONS = [
  { label: "01 / 04 · Client brief", text: "Your brief arrives with the facts, dates and what you want, already in order." },
  { label: "02 / 04 · Evidence index", text: "Every letter, email and photo you share is tagged and easy to find." },
  { label: "03 / 04 · Timeline", text: "Events are laid out in order, so nothing gets missed." },
  { label: "04 / 04 · Case health", text: "Your solicitor sees what's strong, what's missing and every deadline." },
];

/** Until when each of the four client and solicitor photo pairs shows. */
const PHOTO_WINDOWS: [number, number][] = [
  [-9, 3.8],
  [3.8, 4.6],
  [4.6, 5.4],
  [5.4, 99],
];

export const TERMINAL_IMAGE = {
  desktop: { width: 2752, height: 1536, fx: 0.505, fy: 0.45 },
  mobile: { width: 1856, height: 2304, fx: 0.5, fy: 0.47 },
};

const SCENE_ENDS = [1.98, 2.95, 3.8, 4.6, 5.4];

/** Which screen the laptop shows: 0 new case, 1 overview, 2 quotes, 3 comparing, 4 messages, 5 the letter. */
export function howScene(d: number) {
  const i = SCENE_ENDS.findIndex((end) => d < end);
  return i < 0 ? SCENE_ENDS.length : i;
}

const phoneScale = (H: number, mob: boolean) =>
  mob ? Math.max(0.5, Math.min(0.8, (H - 250) / 620)) : Math.max(0.6, Math.min(1, (H - 110) / 620));

/** How far the phone still has to rise as the section arrives. */
const phoneRise = (d: number, H: number, mob: boolean) => (1 - ease(clamp01(1 + d))) * H * 0.7 + (mob ? -6 : 0);

/** How far the hero has given way: `arrive` is the section coming on screen, `gather` the papers
 * vanishing into the phone just after. */
export const heroExit = (d: number) => ({ arrive: clamp01(1 + d), gather: clamp01(d / 0.2) });

export interface PhoneTarget {
  x: number;
  y: number;
  pw: number;
  ph: number;
}

/** Where the phone is, in the hero's own coordinates, for the papers to fly to. */
export function phoneTarget(d: number, W: number, H: number, mob: boolean): PhoneTarget {
  const ps = phoneScale(H, mob);
  // The story's frame is stuck to the top of the screen from d = 0, and the hero scrolled off above it.
  const frameTop = Math.max(0, -d * H) + (1 + d) * H;
  return { x: W / 2, y: frameTop + H / 2 + phoneRise(d, H, mob), pw: 300 * ps, ph: 620 * ps };
}

/** A hero paper on its way into the phone, or null while it is still resting. Deterministic per
 * paper, so scrubbing back retraces the same path. */
export function paperFlight(
  k: number,
  exit: { arrive: number; gather: number },
  target: PhoneTarget,
  from: { x: number; y: number; r: number; s: number },
  H: number,
) {
  if (exit.arrive <= 0) return null;
  const late = ((k * 0.618) % 1) * 0.18;
  const flown = clamp01((exit.arrive - late) / 0.78);
  if (flown <= 0) return null;
  const e = flown * flown * (3 - 2 * flown);
  const spotX = target.x + (((k * 0.618 + 0.2) % 1) - 0.5) * target.pw * 0.7;
  const spotY = target.y + (((k * 0.382 + 0.13) % 1) - 0.5) * target.ph * 0.75;
  let x = from.x + (spotX - from.x) * e;
  let y = from.y + (spotY - from.y) * e + Math.sin(Math.PI * e) * H * 0.28;
  let r = from.r + ((((k * 0.7071 + 0.4) % 1) - 0.5) * 50 - from.r) * e;
  let s = from.s + (Math.min(from.s, 0.68) - from.s) * e;
  let opacity = 1;
  if (exit.gather > 0) {
    const gathered = clamp01((exit.gather - ((k * 0.4142) % 1) * 0.35) / 0.65);
    const e2 = gathered * gathered;
    x += (target.x - x) * e2;
    y += (target.y - y) * e2;
    s *= 1 - 0.96 * e2;
    r += (k % 2 ? 1 : -1) * 90 * e2;
    opacity = 1 - clamp01((gathered - 0.55) / 0.45);
  }
  return { x, y, r, s, opacity };
}

/** How visible a heading is at d. */
export const headingOpacity = (d: number, [a, b, c, e]: readonly [number, number, number, number]) =>
  clamp01((d - a) / (b - a)) * (1 - clamp01((d - c) / (e - c)));

export function howPose(d: number, { W, H, mob, headingH, leftW, rightW }: HowLayout) {
  const ps = phoneScale(H, mob);
  const arrive = clamp01(1 + d);
  const toDesk = ease(clamp01((d - 0.9) / 0.5));
  const introOut = clamp01((d - 0.82) / 0.14);
  const centred = ease(clamp01((d - 2.6) / 0.4));
  const phoneGone = ease(clamp01((d - 2.55) / 0.3));
  const deskGone = ease(clamp01((d - 6.1) / 0.3));

  const deskFit = (H - 300) / 620 * 940;
  const deskW1 = mob ? W * 0.92 : Math.min(940, W * 0.5, deskFit);
  const deskW2 = mob ? W * 0.8 : Math.min(940, W * 0.46, deskFit);
  const deskW = deskW1 + (deskW2 - deskW1) * centred;
  const deskS = deskW / 940;
  const deskS1 = deskW1 / 940;
  const deskCy = (s: number) =>
    mob
      ? 130 + 128 * centred + 310 * s
      : Math.max(80 + headingH + 36 + 310 * s, (H - (headingH + 36 + 730 * s)) / 2 + 24 + headingH + 36 + 310 * s);
  const cx1 = mob ? W / 2 : W / 2 + W * 0.13;
  const cx = cx1 + (W / 2 - cx1) * centred;
  const cy1 = deskCy(deskS1);
  const cy = deskCy(deskS);

  // The phone slides beside the laptop, tilts away, then leaves left once the case is on the desktop.
  const ps3 = mob ? ps * 0.5 : Math.min(ps * 0.8, (592 * deskS1 + 40) / 620);
  const phoneX = mob ? 24 + 150 * ps3 : Math.max(150 * ps3 + 30, cx1 - deskW1 / 2 - 300 * ps3 * 0.5 - 30);
  const phoneY = mob ? Math.min(H - 20 - 310 * ps3, cy1 + 310 * deskS1 + 40) : cy1 + 18;
  const phone = {
    x: (phoneX - W / 2) * toDesk - phoneGone * (phoneX + 300 * ps3),
    y: phoneRise(d, H, mob) + (phoneY - H / 2) * toDesk,
    rotateY: 26 * toDesk,
    rotateX: 5 * toDesk,
    rotateZ: -6 * toDesk,
    scale: ps + (ps3 - ps) * toDesk,
    opacity: 1 - phoneGone,
  };

  const deskIn = ease(clamp01((d - 0.92) / 0.5));
  const desk = {
    x: cx - 470,
    y: cy - 310 + (1 - deskIn) * H * 0.55 - deskGone * 40,
    scale: deskS * (0.9 + 0.1 * deskIn) * (1 - 0.06 * deskGone),
    opacity: deskIn * (1 - deskGone),
  };

  // The client and solicitor photos stand either side of the laptop (above it on a phone).
  const lidTop = cy - 310 * deskS;
  const gap = 32;
  const photoH = mob ? 112 : 732 * deskS;
  const photoW = mob ? Math.min(140, (W - 60) / 2) : Math.max(0, Math.min(photoH * 0.72, (W - deskW) / 2 - gap - 28));
  const photos = {
    opacity: centred * (1 - deskGone),
    top: mob ? lidTop - photoH - 14 : lidTop,
    w: photoW,
    h: photoH,
    leftX: mob ? W / 2 - 6 - photoW : cx - deskW / 2 - gap - photoW,
    rightX: mob ? W / 2 + 6 : cx + deskW / 2 + gap,
    slide: (1 - centred) * (mob ? 30 : 90),
    pair: PHOTO_WINDOWS.map(([a, b]) => clamp01((d - a + 0.06) / 0.12) * (1 - clamp01((d - b + 0.06) / 0.12))),
  };

  const image = mob ? TERMINAL_IMAGE.mobile : TERMINAL_IMAGE.desktop;
  const imageS = Math.max(W / image.width, H / image.height) * (1.02 + 0.03 * clamp01((d - 6.15) / 1.8));
  const imageW = image.width * imageS;
  const imageH = image.height * imageS;
  const terminal = {
    opacity: clamp01((d - 6.15) / 0.2),
    x: Math.min(0, Math.max(W - imageW, W / 2 - imageW * image.fx)),
    y: Math.min(0, Math.max(H - imageH, H * 0.42 - imageH * image.fy)),
    scale: imageS,
    monitor: d >= 6.6 && d < 7.92 ? Math.min(3, Math.floor((d - 6.6) / 0.33)) : -1,
    captions: TERMINAL_CAPTIONS.map((_, i) => {
      const from = 6.6 + i * 0.33;
      return clamp01((d - from) / 0.06) * (1 - clamp01((d - from - 0.27) / 0.06));
    }),
  };

  const introIn = clamp01((d - 0.24) / 0.36);
  const introEased = ease(introIn);
  const leftX = (1 - introEased) * (leftW + 60);
  const rightX = (1 - introEased) * (rightW + 60);
  const hide = (x: number) => Math.max(0, x - 200 + 150 * ps);
  const intro = {
    opacity: mob ? introEased * (1 - introOut) : introIn > 0 ? 1 - introOut : 0,
    interactive: introIn > 0.5 && introOut < 0.5,
    leftShift: mob ? { x: 0, y: (1 - introEased) * 40 } : { x: leftX, y: 0 },
    rightShift: mob ? { x: 0, y: (1 - introEased) * -40 } : { x: -rightX, y: 0 },
    // On desktop each half slides out from behind the phone, hidden until it clears the edge.
    leftClip: mob ? "" : `inset(-20px ${hide(leftX).toFixed(1)}px -20px -20px)`,
    rightClip: mob ? "" : `inset(-20px -20px -20px ${hide(rightX).toFixed(1)}px)`,
  };

  return {
    arrive,
    scene: howScene(d),
    phone,
    desk,
    photos,
    terminal,
    intro,
    headingTop: Math.max(76, cy - 310 * deskS - headingH - 36),
    headings: HOW_HEADINGS.map((h) => headingOpacity(d, h.at)),
  };
}
