import { describe, expect, it } from "vitest";
import {
  createPaperSeeds,
  heroFace,
  layoutPapers,
  overlapsOval,
  overlapsRect,
  paperHomePosition,
  selectedPaperDesktop,
  selectedPaperMobile,
  type Rect,
} from "../hero-geometry";
import { matchProblem, PROBLEMS, START_PROBLEM, twoLines } from "../problems";

const labelFor = (q: string) => PROBLEMS[matchProblem(q)]?.label;

// A repeatable stand-in for Math.random.
function seeded(start = 42) {
  let s = start;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe("matchProblem", () => {
  it("finds the problem from everyday wording", () => {
    expect(labelFor("My landlord won't return my deposit")).toBe("Deposit dispute");
    expect(labelFor("I was sacked yesterday")).toBe("Unfair dismissal");
    expect(labelFor("there is mould and the boiler is broken")).toBe("Landlord repairs");
  });

  it("returns -1 when nothing matches", () => {
    expect(matchProblem("zzz qqq")).toBe(-1);
  });
});

describe("twoLines", () => {
  it("splits into the most even lines", () => {
    expect(twoLines("Questions about your visa?")).toEqual(["Questions about", "your visa?"]);
  });

  it("leaves a single word alone", () => {
    expect(twoLines("Divorce")).toEqual(["Divorce"]);
  });
});

describe("PROBLEMS", () => {
  it("has the starting problem", () => {
    expect(START_PROBLEM).toBeGreaterThanOrEqual(0);
  });

  it("has a unique photo for every problem", () => {
    expect(new Set(PROBLEMS.map((p) => p.slug)).size).toBe(PROBLEMS.length);
  });
});

describe("heroFace", () => {
  const sizes: [number, number, boolean][] = [
    [1440, 900, false],
    [1024, 768, false],
    [768, 1024, false],
    [390, 844, true],
  ];

  it("always covers the hero, with no gaps", () => {
    for (const [W, H, mob] of sizes)
      for (const p of PROBLEMS) {
        const f = heroFace(p, W, H, mob);
        expect(f.ox).toBeLessThanOrEqual(0.001);
        expect(f.oy).toBeLessThanOrEqual(0.001);
        expect(f.ox + f.bw).toBeGreaterThanOrEqual(W - 0.001);
        expect(f.oy + f.bh).toBeGreaterThanOrEqual(H - 0.001);
      }
  });

  it("puts the eyes where the photo says they are", () => {
    const p = PROBLEMS[0];
    const f = heroFace(p, 1440, 900, false);
    expect(f.ex).toBeCloseTo(f.ox + p.fx * f.bw);
    expect(f.ey).toBeCloseTo(f.oy + p.fy * f.bh);
  });
});

describe("createPaperSeeds", () => {
  it("gives every paper its own cell", () => {
    const seeds = createPaperSeeds(22, seeded());
    expect(new Set(seeds.map((s) => s.cell)).size).toBe(22);
  });
});

describe("papers", () => {
  const W = 1440;
  const H = 900;
  const copy: Rect = { l: 500, r: 940, t: 280, b: 620, w: 440, h: 340 };
  const seeds = createPaperSeeds(22, seeded());
  const { homes, orbit } = layoutPapers(seeds, W, H, false, copy);
  const face = heroFace(PROBLEMS[0], W, H, false).oval;
  const frame = { W, H, orbit, face, copy };

  it("never rests a paper on both the copy and the face", () => {
    for (const angle of [0, 0.5, 1.5, 3, 5])
      for (const home of homes) {
        const [x, y] = paperHomePosition(home, angle, 205, 270, frame);
        const onCopy = overlapsRect(x, y, 205 * home.scale * 0.5, 270 * home.scale * 0.5, copy, 0);
        const onFace = overlapsOval(x, y, 205 * home.scale * 0.5, 270 * home.scale * 0.5, face);
        // A paper squeezed between both may still touch one; the render loop hides those.
        if (onCopy) expect(onFace).toBe(false);
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
      }
  });

  it("keeps the selected paper inside the hero, away from the face", () => {
    const r = selectedPaperDesktop(360, 420, W, H, face, copy);
    expect(r.y + (420 * r.scale) / 2).toBeLessThanOrEqual(H);
    expect(r.x - (360 * r.scale) / 2).toBeGreaterThanOrEqual(0);
    expect(r.x + (360 * r.scale) / 2).toBeLessThanOrEqual(W);
    expect(r.x > W / 2).toBe(face.x <= W / 2);
  });

  it("places the selected paper below the copy on a phone", () => {
    const phoneCopy: Rect = { l: 20, r: 370, t: 200, b: 500, w: 350, h: 300 };
    const r = selectedPaperMobile(240, 200, 390, 844, phoneCopy);
    expect(r.x).toBe(195);
    expect(r.y - (200 * r.scale) / 2).toBeGreaterThanOrEqual(phoneCopy.b);
  });
});
