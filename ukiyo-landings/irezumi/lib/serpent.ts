/**
 * Pure geometry helpers for drawing serpentine bodies (dragons, koi, brush strokes)
 * as flat SVG paths. Everything here is deterministic and runs at render time on the
 * server, so the client only ever receives finished path strings.
 */

export type Pt = [number, number];

const r1 = (n: number) => Math.round(n * 10) / 10;
export const f = (p: Pt) => `${r1(p[0])},${r1(p[1])}`;

const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const norm = (a: Pt): Pt => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};

/** Uniform Catmull-Rom through control points, resampled evenly by arc length. */
export function sampleSpline(ctrl: Pt[], n: number): Pt[] {
  const dense: Pt[] = [];
  const P = [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let s = 0; s < 40; s++) {
      const t = s / 40;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) =>
        0.5 *
        (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      dense.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  dense.push(ctrl[ctrl.length - 1]);
  return resample(dense, n);
}

/** Cubic bezier chain given as [p0, c1, c2, p1, c1, c2, p2, ...]. */
export function sampleBeziers(pts: Pt[], n: number): Pt[] {
  const dense: Pt[] = [];
  for (let i = 0; i + 3 < pts.length; i += 3) {
    const [a, b, c, d] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];
    for (let s = 0; s < 40; s++) {
      const t = s / 40;
      const u = 1 - t;
      dense.push([
        u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
        u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
      ]);
    }
  }
  dense.push(pts[pts.length - 1]);
  return resample(dense, n);
}

function resample(dense: Pt[], n: number): Pt[] {
  const cum = [0];
  for (let i = 1; i < dense.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  }
  const total = cum[cum.length - 1];
  const out: Pt[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const target = (k / (n - 1)) * total;
    while (j < cum.length - 2 && cum[j + 1] < target) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const t = (target - cum[j]) / seg;
    out.push([
      dense[j][0] + (dense[j + 1][0] - dense[j][0]) * t,
      dense[j][1] + (dense[j + 1][1] - dense[j][1]) * t,
    ]);
  }
  return out;
}

export interface Body {
  pts: Pt[];
  tan: Pt[];
  nor: Pt[];
  w: number[];
  n: number;
}

/** A body is a centreline with tangents, normals (N = (-ty, tx)) and a width per sample. */
export function makeBody(pts: Pt[], width: (t: number) => number): Body {
  const n = pts.length;
  const tan: Pt[] = [];
  const nor: Pt[] = [];
  const w: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const t = norm([b[0] - a[0], b[1] - a[1]]);
    tan.push(t);
    nor.push([-t[1], t[0]]);
    w.push(width(i / (n - 1)));
  }
  return { pts, tan, nor, w, n };
}

export const idx = (b: Body, t: number) => Math.max(0, Math.min(b.n - 1, Math.round(t * (b.n - 1))));

/** Point at parameter t, offset across the body by u ∈ [-1, 1] (fraction of half-width). */
export function at(b: Body, t: number, u = 0) {
  const i = idx(b, t);
  const h = (b.w[i] / 2) * u;
  const p = add(b.pts[i], mul(b.nor[i], h));
  const deg = (Math.atan2(b.tan[i][1], b.tan[i][0]) * 180) / Math.PI;
  return { p, T: b.tan[i], N: b.nor[i], w: b.w[i], deg };
}

/** SVG transform that maps a local drawing (+x = forward, -y = the +N side) onto the body. */
export function anchor(b: Body, t: number, u: number, scale: number) {
  const a = at(b, t, u);
  return `translate(${f(a.p)}) rotate(${r1(a.deg)}) scale(${r1(scale * 100) / 100},${-r1(scale * 100) / 100})`;
}

/** Closed outline of the body between t0..t1. Caps: flat or round. */
export function outline(
  b: Body,
  t0 = 0,
  t1 = 1,
  opts: { capStart?: "flat" | "round"; capEnd?: "flat" | "round" } = {},
) {
  const i0 = idx(b, t0);
  const i1 = idx(b, t1);
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = i0; i <= i1; i++) {
    const h = b.w[i] / 2;
    left.push(add(b.pts[i], mul(b.nor[i], h)));
    right.push(add(b.pts[i], mul(b.nor[i], -h)));
  }
  let d = `M${f(left[0])}`;
  for (let i = 1; i < left.length; i++) d += `L${f(left[i])}`;
  if (opts.capEnd === "round") {
    const h = (b.w[i1] / 2) * 1.33;
    const T = b.tan[i1];
    d += `C${f(add(left[left.length - 1], mul(T, h)))} ${f(add(right[right.length - 1], mul(T, h)))} ${f(right[right.length - 1])}`;
  }
  for (let i = right.length - 1; i >= 0; i--) d += `L${f(right[i])}`;
  if (opts.capStart === "round") {
    const h = (b.w[i0] / 2) * 1.33;
    const T = mul(b.tan[i0], -1);
    d += `C${f(add(right[0], mul(T, h)))} ${f(add(left[0], mul(T, h)))} ${f(left[0])}`;
  }
  return d + "Z";
}

/** Open polyline running along the body at offset u. */
export function rail(b: Body, u: number, t0 = 0, t1 = 1) {
  let d = "";
  for (let i = idx(b, t0); i <= idx(b, t1); i++) {
    const p = add(b.pts[i], mul(b.nor[i], (b.w[i] / 2) * u));
    d += (d ? "L" : "M") + f(p);
  }
  return d;
}

/** Dorsal spines / fins along one side (side = 1 → +N). Spines lean back toward the tail. */
export function spines(
  b: Body,
  o: { t0: number; t1: number; count: number; height: number; side?: 1 | -1; lean?: number; inset?: number },
) {
  const side = o.side ?? 1;
  const lean = o.lean ?? 0.9;
  const inset = o.inset ?? 0.85;
  let d = "";
  const span = (o.t1 - o.t0) / o.count;
  for (let k = 0; k < o.count; k++) {
    const tc = o.t0 + span * (k + 0.5);
    const ta = tc - span * 0.55;
    const tb = tc + span * 0.45;
    const A = at(b, ta, side * inset);
    const B = at(b, tb, side * inset);
    const C = at(b, tc, side);
    const h = C.w * o.height;
    const apex = add(add(C.p, mul(C.N, side * h)), mul(C.T, -h * lean));
    const ctrl = add(B.p, mul(B.N, side * h * 0.75));
    d += `M${f(A.p)}L${f(apex)}Q${f(ctrl)} ${f(B.p)}Z`;
  }
  return d;
}

/** Crescent scale marks (stroke only). */
export function scales(
  b: Body,
  o: { t0: number; t1: number; rows: number[]; spacing: number; size: number; minW?: number },
) {
  let d = "";
  let col = 0;
  let i = idx(b, o.t0);
  const end = idx(b, o.t1);
  while (i <= end) {
    const w = b.w[i];
    if (w >= (o.minW ?? 0)) {
      const stagger = col % 2 ? 0.5 : 0;
      for (let r = 0; r < o.rows.length; r++) {
        const u = o.rows[r] + (stagger && r < o.rows.length - 1 ? (o.rows[r + 1] - o.rows[r]) * stagger : 0);
        if (stagger && r === o.rows.length - 1) continue;
        const c = add(b.pts[i], mul(b.nor[i], (w / 2) * u));
        const s = w * o.size;
        const T = b.tan[i];
        const N = b.nor[i];
        d += `M${f(add(c, mul(N, s)))}Q${f(add(c, mul(T, -s * 1.7)))} ${f(add(c, mul(N, -s)))}`;
      }
    }
    // step forward by roughly `spacing` × width
    const stepLen = Math.max(1, Math.round((w * o.spacing) / segLen(b, i)));
    i += stepLen;
    col++;
  }
  return d;
}

function segLen(b: Body, i: number) {
  const j = Math.min(b.n - 1, i + 1);
  const k = j === i ? i - 1 : i;
  return Math.hypot(b.pts[j][0] - b.pts[k][0], b.pts[j][1] - b.pts[k][1]) || 1;
}

/** Belly band along one side plus transverse plate lines. */
export function belly(b: Body, o: { t0: number; t1: number; side?: 1 | -1; depth: number; every: number }) {
  const side = o.side ?? -1;
  const i0 = idx(b, o.t0);
  const i1 = idx(b, o.t1);
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  for (let i = i0; i <= i1; i++) {
    const h = b.w[i] / 2;
    outer.push(add(b.pts[i], mul(b.nor[i], side * h * 0.96)));
    inner.push(add(b.pts[i], mul(b.nor[i], side * h * (1 - o.depth))));
  }
  let fill = `M${f(outer[0])}`;
  for (let i = 1; i < outer.length; i++) fill += `L${f(outer[i])}`;
  for (let i = inner.length - 1; i >= 0; i--) fill += `L${f(inner[i])}`;
  fill += "Z";
  let lines = "";
  for (let i = 0; i < outer.length; i += o.every) {
    const bow = mul(b.tan[i0 + i], -b.w[i0 + i] * 0.06);
    const mid = add(mul(add(outer[i], inner[i]), 0.5), bow);
    lines += `M${f(outer[i])}Q${f(mid)} ${f(inner[i])}`;
  }
  return { fill, lines };
}

/**
 * A patch living inside the body: spans t0..t1 and fills from the u=edge side to a wavy
 * inner boundary. Used for koi markings so they never spill over the outline.
 */
export function patch(
  b: Body,
  o: { t0: number; t1: number; from: number; to: number; wave?: number; freq?: number; phase?: number },
) {
  const i0 = idx(b, o.t0);
  const i1 = idx(b, o.t1);
  const a: Pt[] = [];
  const c: Pt[] = [];
  const len = Math.max(1, i1 - i0);
  for (let i = i0; i <= i1; i++) {
    const s = (i - i0) / len;
    // taper both ends so the patch closes softly
    const env = Math.sin(Math.PI * s);
    const h = b.w[i] / 2;
    const wob = (o.wave ?? 0.15) * Math.sin(s * Math.PI * (o.freq ?? 3) + (o.phase ?? 0));
    const uTo = o.from + (o.to - o.from) * Math.min(1, env * 1.4) + wob * env;
    a.push(add(b.pts[i], mul(b.nor[i], h * o.from)));
    c.push(add(b.pts[i], mul(b.nor[i], h * Math.max(-1, Math.min(1, uTo)))));
  }
  let d = `M${f(a[0])}`;
  for (let i = 1; i < a.length; i++) d += `L${f(a[i])}`;
  for (let i = c.length - 1; i >= 0; i--) d += `L${f(c[i])}`;
  return d + "Z";
}

/** Points on a circle (for ensō / rings). */
export function arcPoints(cx: number, cy: number, r: number, a0: number, a1: number, n: number, jitter = 0): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / (n - 1);
    const rr = r + jitter * Math.sin(i * 2.7) * Math.cos(i * 1.3);
    out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return out;
}

/** Deterministic pseudo-random generator so server output is stable. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
