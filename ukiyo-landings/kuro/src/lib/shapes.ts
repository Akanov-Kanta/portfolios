/* Small deterministic geometry helpers for the hand-built SVG illustrations. */

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Deterministic PRNG so server and client markup match. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Ukiyo-e pine needle cluster: a half-disc fan with a toothed outer edge.
 * `angle` is the direction (deg) the fan opens toward.
 */
export function fanPath(
  cx: number,
  cy: number,
  r: number,
  angle: number,
  spread = 150,
  teeth = 22,
) {
  const a0 = ((angle - spread / 2) * Math.PI) / 180;
  const a1 = ((angle + spread / 2) * Math.PI) / 180;
  const pts: string[] = [`M${r1(cx)} ${r1(cy)}`];
  const steps = teeth * 2;
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const rr = i % 2 === 0 ? r : r * 0.82;
    pts.push(`L${r1(cx + Math.cos(a) * rr)} ${r1(cy + Math.sin(a) * rr)}`);
  }
  pts.push("Z");
  return pts.join(" ");
}

/** A tapered brush/branch stroke through points [x, y, width]. */
export function taperedPath(points: [number, number, number][]) {
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const [x, y, w] = points[i];
    const [px, py] = points[Math.max(0, i - 1)];
    const [nx, ny] = points[Math.min(points.length - 1, i + 1)];
    let dx = nx - px;
    let dy = ny - py;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const ox = -dy * (w / 2);
    const oy = dx * (w / 2);
    left.push(`${r1(x + ox)} ${r1(y + oy)}`);
    right.unshift(`${r1(x - ox)} ${r1(y - oy)}`);
  }
  return `M${left.join(" L")} L${right.join(" L")} Z`;
}

/** Sunburst / scalloped seal outline. */
export function burstPath(
  cx: number,
  cy: number,
  r: number,
  inner: number,
  points: number,
) {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI * i) / points - Math.PI / 2;
    const rr = i % 2 === 0 ? r : inner;
    out.push(`${r1(cx + Math.cos(a) * rr)} ${r1(cy + Math.sin(a) * rr)}`);
  }
  return `M${out.join(" L")} Z`;
}

/** Irregular blob (moon maria, ink splatter). */
export function blobPath(
  cx: number,
  cy: number,
  r: number,
  seed: number,
  wobble = 0.28,
  n = 9,
) {
  const rand = seeded(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const rr = r * (1 - wobble / 2 + rand() * wobble);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.86]);
  }
  // Catmull-Rom → cubic bezier for a soft but still flat silhouette
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d + " Z";
}

/** Ink splatter: a main drop plus satellite droplets. */
export function splatter(cx: number, cy: number, r: number, seed: number) {
  const rand = seeded(seed);
  const parts = [blobPath(cx, cy, r, seed, 0.6, 11)];
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2;
    const dist = r * (1.3 + rand() * 1.8);
    const rr = r * (0.06 + rand() * 0.16);
    parts.push(
      blobPath(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, rr, seed + i + 1, 0.4, 6),
    );
  }
  return parts.join(" ");
}

/** Auspicious cloud curl (ink line ornament): a spiral that unrolls into a tail. */
export function cloudCurl(cx: number, cy: number, r: number, dir = 1, tail = 3) {
  const segs: string[] = [];
  const turns = 1.6;
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = dir * t * turns * Math.PI * 2;
    const rr = r * t;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    segs.push(`${i === 0 ? "M" : "L"}${r1(x)} ${r1(y)}`);
  }
  const endA = dir * turns * Math.PI * 2;
  const ex = cx + Math.cos(endA) * r;
  const ey = cy + Math.sin(endA) * r;
  segs.push(`Q${r1(ex + dir * r * tail * 0.5)} ${r1(ey + r * 0.9)} ${r1(ex + dir * r * tail)} ${r1(ey + r * 0.2)}`);
  return segs.join(" ");
}
