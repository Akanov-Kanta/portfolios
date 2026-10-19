import { rng, r2 } from "@/lib/random";

/**
 * Procedural "hand-drawn" eye, after the edit's swarm (reference/frames/t_01.00.jpg, crop in
 * reference/proto/frame_eye_crop.png): an almond drawn in several wobbly, overshooting pen passes (some
 * only partial), a furry fringe of tapered lashes plus fine hair strokes along the upper lid, a hatched
 * double line under the lower lid ("teeth"), a hooked inner corner, and a large grey iris made of a
 * wobbling spiral and broken rings that the upper lid cuts. Pure function of the seed (same output on
 * server and client). Units are the SVG viewBox below.
 */
export const EYE_VIEWBOX = { w: 240, h: 140 } as const;
/** where the lids meet, as a fraction of the viewBox (blink pivot) */
export const EYE_PIVOT = { x: 0.5, y: 0.5 } as const;

type Pt = [number, number];
type Cubic = [Pt, Pt, Pt, Pt];

const bez = ([p0, p1, p2, p3]: Cubic, t: number): Pt => {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
};

const tangent = ([p0, p1, p2, p3]: Cubic, t: number): Pt => {
  const u = 1 - t;
  const x = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
  const y = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

const P = (p: Pt) => `${r2(p[0])} ${r2(p[1])}`;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export interface EyeStroke {
  d: string;
  w: number; // stroke width
  o: number; // opacity
}

export interface EyeGeometry {
  almond: string; // closed shape (sclera fill + iris clip)
  strokes: EyeStroke[]; // lid passes, crease, under-eye band, hatching, inner corner
  hairs: EyeStroke[]; // fine fur strokes along the upper lid
  lashes: string; // filled tapered spikes, one path
  iris: { cx: number; cy: number; r: number };
  rings: { r: number; w: number; o: number; light: boolean; dash: string }[];
  spiral: string; // light pen spiral
  spiralDark: string; // dark spiral interleaved with it
}

export function eyeGeometry(seed: number): EyeGeometry {
  const R = rng(seed * 7919 + 13);
  const j = (a: number) => R.spread(a);

  // the almond: pointed inner corner (left), a high arched upper lid, a flatter lower lid. Each seed gets
  // its own asymmetry: where the arch peaks (toward the inner or outer corner), how open the eye is,
  // how far the outer corner lifts, and how deep the lower lid sags, so no two eyes are mirror-clean.
  const peak = R.range(-1, 1); // -1: arch peaks near the inner corner, +1: near the outer corner
  const open = R.range(0.82, 1.12);
  const lift = R.range(-6, 14);
  const sag = R.range(-10, 8);
  const L: Pt = [20 + j(5), 80 + j(6)];
  const Rt: Pt = [220 + j(5), 62 - lift + j(4)];
  const upper: Cubic = [
    L,
    [56 + peak * 14 + j(6), 78 - (88 - peak * 10) * open + j(6)],
    [164 + peak * 14 + j(6), 70 - (86 + peak * 10) * open + j(6)],
    Rt,
  ];
  const lower: Cubic = [L, [70 + j(10), 124 + sag * 0.6 + j(5)], [176 + j(10), 114 + sag + j(5)], Rt];

  const almond = `M${P(L)}C${P(upper[1])} ${P(upper[2])} ${P(Rt)}C${P(lower[2])} ${P(lower[1])} ${P(L)}Z`;

  /** unit normal pointing out of the eye (up for the upper lid, down for the lower one) */
  const normal = (c: Cubic, t: number, up: boolean): Pt => {
    const [tx, ty] = tangent(c, clamp01(t) || 0.001);
    return up ? [ty, -tx] : [-ty, tx];
  };

  /**
   * One pen pass along a lid over [t0, t1], `offset` units out of the eye, with a slow hand wobble (two
   * low-frequency sines) plus tremor, overshooting past both ends along the tangent.
   */
  const pass = (c: Cubic, up: boolean, t0: number, t1: number, offset: number, wob: number, over = 0) => {
    const n = 18;
    const ph1 = R.range(0, 6.28), ph2 = R.range(0, 6.28), f1 = R.range(2, 4), f2 = R.range(5, 9);
    let d = "";
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const t = clamp01(t0 + (t1 - t0) * u);
      const [x, y] = bez(c, t);
      const [tx, ty] = tangent(c, t || 0.001);
      const [nx, ny] = normal(c, t, up);
      const w = wob * (Math.sin(u * f1 + ph1) * 0.7 + Math.sin(u * f2 + ph2) * 0.3) + j(wob * 0.25);
      const ext = i === 0 ? -over : i === n ? over : 0;
      d += `${i ? "L" : "M"}${r2(x + nx * (offset + w) + tx * ext)} ${r2(y + ny * (offset + w) + ty * ext)}`;
    }
    return d;
  };

  const strokes: EyeStroke[] = [];
  // upper lid: one heavy line, two medium passes, two thin partial passes drifting off the line
  strokes.push({ d: pass(upper, true, 0, 1, j(0.6), 1.2, 3), w: 3.4, o: 1 });
  strokes.push({ d: pass(upper, true, R.range(0.15, 0.35), 1, 5 + j(1.2), 2, 6), w: 1.6, o: 0.85 });
  strokes.push({ d: pass(upper, true, 0, 0.97, -1.5 + j(1), 2.4, 8), w: 1.3, o: 0.7 });
  strokes.push({ d: pass(upper, true, R.range(0, 0.25), R.range(0.55, 0.85), 3.5 + j(1.5), 3, 2), w: 0.9, o: 0.55 });
  strokes.push({ d: pass(upper, true, R.range(0.35, 0.6), 1, -3 + j(1.5), 3, 6), w: 0.8, o: 0.5 });
  // lower lid: two passes + one thin, then the under-eye band (two lines) with hatching between
  strokes.push({ d: pass(lower, false, 0, 1, j(0.6), 1.4, 2), w: 2.4, o: 0.95 });
  strokes.push({ d: pass(lower, false, 0.04, 1, 1.8 + j(1), 2.4, 5), w: 1.2, o: 0.7 });
  strokes.push({ d: pass(lower, false, R.range(0.1, 0.3), R.range(0.75, 1), -1.5 + j(1), 2.5, 3), w: 0.8, o: 0.5 });
  const band1 = 14 + R.range(0, 4);
  const band2 = band1 + 9 + R.range(0, 4);
  strokes.push({ d: pass(lower, false, 0.26, 1, band1, 1.6, 6), w: 1.3, o: 0.75 });
  strokes.push({ d: pass(lower, false, 0.34, 1, band2, 2, 4), w: 0.9, o: 0.5 });
  // crease above the lid
  strokes.push({ d: pass(upper, true, 0.2 + j(0.05), 0.84 + j(0.05), 12 + j(3), 1.5), w: 1, o: 0.45 });
  // hatching between the lower lid and the band, leaning with the curve ("teeth")
  const nHatch = R.int(11, 16);
  for (let i = 0; i < nHatch; i++) {
    const t = 0.3 + (0.66 * i) / (nHatch - 1) + j(0.01);
    const [x, y] = bez(lower, t);
    const [tx, ty] = tangent(lower, t);
    const [nx, ny] = normal(lower, t, false);
    const a = 1.5 + R.range(0, 2), b = band1 + R.range(0, 6);
    const lean = j(2.5);
    strokes.push({
      d: `M${r2(x + nx * a + tx * lean)} ${r2(y + ny * a + ty * lean)}L${r2(x + nx * b - tx * lean)} ${r2(y + ny * b - ty * lean)}`,
      w: R.range(0.8, 1.6),
      o: R.range(0.5, 0.9),
    });
  }
  // the hooked inner corner (tear duct)
  strokes.push({
    d: `M${P([L[0] + 5, L[1] - 2])}L${P([L[0] - 3, L[1] + 1])}L${r2(L[0] + 1 + j(2))} ${r2(L[1] + 7 + j(2))}l${r2(5 + j(2))} ${r2(1 + j(1.5))}`,
    w: 1.5,
    o: 0.85,
  });

  // lashes: tapered filled spikes swept toward the outer corner
  let lashes = "";
  const spike = (base: Pt, dir: Pt, len: number, w: number, bend: number) => {
    const [dx, dy] = dir;
    const px = -dy, py = dx;
    const tip: Pt = [base[0] + dx * len + px * bend, base[1] + dy * len + py * bend];
    const mid: Pt = [base[0] + dx * len * 0.5 + px * bend * 0.6, base[1] + dy * len * 0.5 + py * bend * 0.6];
    const a: Pt = [base[0] - px * w, base[1] - py * w];
    const b: Pt = [base[0] + px * w, base[1] + py * w];
    lashes += `M${P(a)}Q${P([mid[0] - px * w * 0.45, mid[1] - py * w * 0.45])} ${P(tip)}Q${P([mid[0] + px * w * 0.45, mid[1] + py * w * 0.45])} ${P(b)}Z`;
  };
  /** out of the eye, swept along the lid toward the outer corner */
  const outward = (c: Cubic, t: number, up: boolean, sweepK: number): Pt => {
    const [tx, ty] = tangent(c, t);
    let [nx, ny] = normal(c, t, up);
    const sweep = (t - 0.42) * sweepK + j(0.22);
    nx += tx * sweep;
    ny += ty * sweep;
    const l = Math.hypot(nx, ny) || 1;
    return [nx / l, ny / l];
  };

  const nUpper = R.int(24, 30);
  for (let i = 0; i < nUpper; i++) {
    const t = Math.min(0.99, Math.max(0.05, 0.05 + (0.94 * i) / (nUpper - 1) + j(0.01)));
    const base = bez(upper, t);
    const shape = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.5);
    const long = R.next() < 0.22 ? R.range(1.5, 2.1) : 1;
    const len = (8 + 26 * shape) * R.range(0.5, 1.15) * long;
    spike([base[0] + j(1.2), base[1] + j(1.2)], outward(upper, t, true, 1.1), len, R.range(1.4, 2.6), j(5));
  }
  // a few lashes trailing off the outer corner, drooping
  for (let i = 0; i < 4; i++) {
    const base = bez(upper, 0.96 + i * 0.01);
    const a = R.range(-0.15, 0.55);
    spike([base[0] + i * 1.5, base[1] + i * 1.5], [Math.cos(a), Math.sin(a)], R.range(8, 18), R.range(0.9, 1.5), j(3));
  }
  // short lashes hanging from the under-eye band
  const nLower = R.int(14, 20);
  for (let i = 0; i < nLower; i++) {
    const t = 0.3 + (0.68 * i) / (nLower - 1) + j(0.015);
    const [x, y] = bez(lower, t);
    const [nx, ny] = normal(lower, t, false);
    spike([x + nx * band1, y + ny * band1], outward(lower, t, false, 0.6), R.range(3, 10) * Math.sin(Math.PI * t) + 2, R.range(0.6, 1.1), j(1.5));
  }

  // fur: fine hair strokes crossing the upper lid edge (the frame's lids read "hairy", not inked)
  const hairs: EyeStroke[] = [];
  const nHair = R.int(22, 30);
  for (let i = 0; i < nHair; i++) {
    const t = R.range(0.04, 0.99);
    const [x, y] = bez(upper, t);
    const [dx, dy] = outward(upper, t, true, 0.9);
    const s0 = R.range(-3, 1), s1 = R.range(4, 13) * Math.pow(Math.sin(Math.PI * t), 0.4);
    hairs.push({
      d: `M${r2(x + dx * s0)} ${r2(y + dy * s0)}L${r2(x + dx * s1 + j(1.5))} ${r2(y + dy * s1 + j(1.5))}`,
      w: R.range(0.5, 1.1),
      o: R.range(0.45, 0.95),
    });
  }

  // iris: large, a touch high and off-centre, cut by the upper lid (clipped to the almond)
  const iris = { cx: r2(114 + j(6)), cy: r2(50 + j(3)), r: r2(R.range(44, 49)) };
  const rings: EyeGeometry["rings"] = [];
  const nRings = R.int(4, 6);
  for (let i = 0; i < nRings; i++) {
    const k = 1 - i / (nRings + 0.6);
    rings.push({
      r: r2(iris.r * k * R.range(0.95, 1)),
      w: r2(R.range(0.6, 1.4)),
      o: r2(R.range(0.3, 0.7)),
      light: i % 2 === 0,
      dash: `${r2(R.range(10, 40))} ${r2(R.range(2, 9))}`,
    });
  }

  // two interleaved Archimedean spirals from the pupil out (light pen line + dark line), wobbling
  const spiralPath = (phase: number, wob: number) => {
    let d = "";
    const turns = R.range(5, 6.5);
    const steps = 160;
    const r0 = 2.5;
    const f = R.range(0.25, 0.5), ph = R.range(0, 6.28);
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * turns * Math.PI * 2 + phase;
      const rr = r0 + (iris.r * 0.93 - r0) * (i / steps) + wob * Math.sin(th * f + ph) + j(0.25);
      d += `${i ? "L" : "M"}${r2(iris.cx + Math.cos(th) * rr)} ${r2(iris.cy + Math.sin(th) * rr)}`;
    }
    return d;
  };
  const spiral = spiralPath(0, 1.1);
  const spiralDark = spiralPath(Math.PI, 0.9);

  return { almond, strokes, hairs, lashes, iris, rings, spiral, spiralDark };
}
