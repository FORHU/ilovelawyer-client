// Where things sit in the landing page's hero: the photo (kept clear of the copy, eyes in frame) and
// the drifting papers (kept off the person's face and the copy). Plain maths, no DOM.

import { HERO_IMAGE } from "./problems";

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export interface Oval {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export interface Rect {
  l: number;
  t: number;
  r: number;
  b: number;
  w: number;
  h: number;
}

/** Sizes the photo to cover W×H with the eyes clear of the centre copy, and returns the oval around
 * the face that papers keep out of. */
export function heroFace(p: { fx: number; fy: number }, W: number, H: number, mob: boolean) {
  const { width: iw, height: ih } = HERO_IMAGE;
  const s = Math.max(W / iw, H / ih);
  const bw = iw * s;
  const bh = ih * s;
  const py = mob ? 0.28 : p.fy;
  const rx = mob ? W * 0.3 : W * 0.11;
  const ry = mob ? H * 0.18 : rx * 1.6;
  let ox: number;
  if (mob) {
    ox = (W - bw) * p.fx;
  } else {
    const gap = Math.max(170, W * 0.15) + rx * 0.9;
    const tx = p.fx < 0.5 ? Math.min(W * p.fx, W / 2 - gap) : Math.max(W * p.fx, W / 2 + gap);
    ox = Math.max(W - bw, Math.min(0, tx - p.fx * bw));
  }
  const oy = (H - bh) * py;
  const ex = ox + p.fx * bw;
  const ey = oy + p.fy * bh;
  const oval: Oval = { x: ex, y: ey - ry * 0.1, rx, ry };
  return { bw, bh, ox, oy, ex, ey, oval };
}

/** Places the closing section's portrait so the eyes land on one side of a frame 28% taller than the
 * screen (the parallax needs the extra), covering it with no gaps. */
export function portraitPlacement(W: number, H: number, mob: boolean) {
  const iw = 1920;
  const ih = 815;
  const fx = 0.59;
  const fy = 0.31;
  const frameH = H * 1.28;
  const tx = mob ? W * 0.5 : W * 0.75;
  const ty = (mob ? 0.3 : 0.45) * H + 0.14 * H;
  const cover = Math.max(W / iw, frameH / ih);
  const s = Math.min(cover * 1.8, Math.max(cover, tx / (fx * iw), (W - tx) / ((1 - fx) * iw), ty / (fy * ih), (frameH - ty) / ((1 - fy) * ih)));
  const width = iw * s;
  const height = ih * s;
  return {
    left: Math.max(W - width, Math.min(0, tx - fx * width)),
    top: Math.max(frameH - height, Math.min(0, ty - fy * height)),
    width,
    height,
  };
}

/** One paper's fixed character, rolled once per page view. */
export interface PaperSeed {
  /** Which grid cell it takes. */
  cell: number;
  /** Stacking order, raised when a paper is put back. */
  z: number;
  r0: number;
  phase: number;
  jx: number;
  jy: number;
}

export function createPaperSeeds(n: number, random: () => number = Math.random): PaperSeed[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order.map((o) => ({
    cell: o,
    z: o,
    r0: (random() < 0.5 ? -1 : 1) * (3 + random() * 12),
    phase: random() * Math.PI * 2,
    jx: random() - 0.5,
    jy: random() - 0.5,
  }));
}

export interface PaperHome {
  scale: number;
  /** Polar position on the orbit's ellipse. */
  th0: number;
  rn: number;
}

export interface Orbit {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** Scatters the papers over a grid, outermost cells first, then pushes any that land on the copy out
 * to a wavy boundary around it, so they ring the centre. */
export function layoutPapers(seeds: PaperSeed[], W: number, H: number, mob: boolean, copy: { w: number; h: number }) {
  const n = seeds.length;
  const cols = Math.max(3, Math.round(Math.sqrt((n * W) / H)));
  const rows = Math.ceil(n / cols) + 1;
  const cx = W / 2;
  const cy = H / 2;
  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ x: ((c + 0.5) * W) / cols, y: ((r + 0.5) * H) / rows });
  cells.sort((a, b) => Math.hypot((b.x - cx) / W, (b.y - cy) / H) - Math.hypot((a.x - cx) / W, (a.y - cy) / H));
  const used = cells.slice(0, n);
  const cw = W / cols;
  const ch = H / rows;
  const scale = Math.max(0.6, Math.min(1.1, (cw * 1.45) / 215));
  const rx = Math.max(copy.w / 2 + (mob ? 10 : 40), mob ? W * 0.4 : W * 0.22);
  const ry = copy.h / 2 + (mob ? 20 : 40);
  const halfDiagonal = (Math.hypot(215, 270) / 2) * scale * 0.9;
  const homes: PaperHome[] = seeds.map((seed) => {
    const cell = used[seed.cell % used.length];
    let x = cell.x + seed.jx * cw * 0.5;
    let y = cell.y + seed.jy * ch * 0.5;
    const dx = x - cx;
    const dy = y - cy;
    const th = Math.atan2(dy / ry, dx / rx);
    const wave = 1 + 0.1 * (1 + Math.sin(3 * th + 1.3)) + 0.05 * (1 + Math.sin(5 * th + 0.4));
    const boundary = Math.hypot(rx * wave * Math.cos(th), ry * wave * Math.sin(th));
    const d = Math.hypot(dx, dy) || 1;
    if (d < boundary + halfDiagonal) {
      const f = (boundary + halfDiagonal) / d;
      x = cx + dx * f;
      y = cy + dy * f;
    }
    return { scale, th0: Math.atan2((y - cy) / ry, (x - cx) / rx), rn: Math.hypot((x - cx) / rx, (y - cy) / ry) };
  });
  const orbit: Orbit = { cx, cy, rx, ry };
  return { homes, orbit };
}

export const overlapsOval = (x: number, y: number, w: number, h: number, F: Oval) => {
  const cx = Math.max(x - w / 2, Math.min(x + w / 2, F.x));
  const cy = Math.max(y - h / 2, Math.min(y + h / 2, F.y));
  return Math.pow((cx - F.x) / F.rx, 2) + Math.pow((cy - F.y) / F.ry, 2) < 1;
};

export const overlapsRect = (x: number, y: number, w: number, h: number, c: Rect, gap: number) =>
  x + w / 2 > c.l - gap && x - w / 2 < c.r + gap && y + h / 2 > c.t - gap && y - h / 2 < c.b + gap;

/** Where a resting paper sits at this point in the orbit, moved off the face and the copy. */
export function paperHomePosition(
  home: PaperHome,
  angle: number,
  w: number,
  h: number,
  frame: { W: number; H: number; orbit: Orbit; face: Oval; copy: Rect },
): [number, number] {
  const { W, H, orbit: O, face: F, copy: c } = frame;
  const th = home.th0 + angle;
  let x = O.cx + home.rn * O.rx * Math.cos(th);
  let y = O.cy + home.rn * O.ry * Math.sin(th);
  const pw = w * home.scale;
  const ph = h * home.scale;
  const pr = Math.min(pw, ph) * 0.45;
  const push = () => {
    const dx = x - F.x;
    const dy = y - F.y;
    const e = Math.hypot(dx / (F.rx + pr), dy / (F.ry + pr));
    if (e < 1) {
      if (e < 0.01) {
        x = F.x + (F.x > W / 2 ? -1 : 1) * (F.rx + pr);
      } else {
        x = F.x + dx / e;
        y = F.y + dy / e;
      }
    }
    const g = 14;
    if (overlapsRect(x, y, pw, ph, c, g)) {
      const mL = x + pw / 2 - (c.l - g);
      const mR = c.r + g - (x - pw / 2);
      const mT = y + ph / 2 - (c.t - g);
      const mB = c.b + g - (y - ph / 2);
      const least = Math.min(mL, mR, mT, mB);
      if (least === mL) x -= mL;
      else if (least === mR) x += mR;
      else if (least === mT) y -= mT;
      else y += mB;
    }
  };
  push();
  x = Math.max(w * 0.35, Math.min(W - w * 0.35, x));
  y = Math.max(70 + h * 0.3, Math.min(H + h * 0.05, y));
  push();
  return [x, y];
}

/** The selected paper: flat, on the side away from the person's face (desktop). */
export function selectedPaperDesktop(w: number, h: number, W: number, H: number, face: Oval, copy: Rect) {
  const left = face.x > W / 2;
  const gap = 24;
  const padB = left ? 16 : 76;
  const fitX = ((left ? copy.l : W - copy.r) - gap - 16) / w;
  const fitY = (H - padB - (copy.b + gap)) / h;
  const scale = Math.min(1, Math.max(fitX, fitY, 0.7), (H - 106) / h);
  return {
    x: left ? 16 + (w * scale) / 2 : W - 16 - (w * scale) / 2,
    y: H - padB - (h * scale) / 2,
    scale,
  };
}

/** The selected paper on a phone: centred below the copy. */
export function selectedPaperMobile(w: number, h: number, W: number, H: number, copy: Rect) {
  const scale = Math.min(1.15, Math.max(0.85, (W * 0.68) / w));
  return { x: W / 2, y: Math.max(copy.b + 16 + (h * scale) / 2, H - 12 - (h * scale) / 2), scale };
}
