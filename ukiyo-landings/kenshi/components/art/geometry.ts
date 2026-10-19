export type Pt = readonly [number, number];

/** Deterministic PRNG (mulberry32) so server and client render identical art. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Tapered limb from joint a to joint b: a quad whose ends are wa / wb wide,
 * closed with half-circle caps so joints read as rounded (pictogram style).
 */
export function limb(a: Pt, b: Pt, wa: number, wb = wa): string {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const ha = wa / 2;
  const hb = wb / 2;
  const p1 = [a[0] + nx * ha, a[1] + ny * ha];
  const p2 = [b[0] + nx * hb, b[1] + ny * hb];
  const p3 = [b[0] - nx * hb, b[1] - ny * hb];
  const p4 = [a[0] - nx * ha, a[1] - ny * ha];
  return (
    `M${r1(p1[0])} ${r1(p1[1])}L${r1(p2[0])} ${r1(p2[1])}` +
    `A${r1(hb)} ${r1(hb)} 0 0 0 ${r1(p3[0])} ${r1(p3[1])}` +
    `L${r1(p4[0])} ${r1(p4[1])}` +
    `A${r1(ha)} ${r1(ha)} 0 0 0 ${r1(p1[0])} ${r1(p1[1])}Z`
  );
}

/** Straight blade: thin wedge from hilt to tip with a slight curve (sori). */
export function blade(hilt: Pt, tip: Pt, w = 7, sori = 0.06): string {
  const dx = tip[0] - hilt[0];
  const dy = tip[1] - hilt[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const mx = (hilt[0] + tip[0]) / 2 + nx * len * sori;
  const my = (hilt[1] + tip[1]) / 2 + ny * len * sori;
  const h = w / 2;
  return (
    `M${r1(hilt[0] + nx * h)} ${r1(hilt[1] + ny * h)}` +
    `Q${r1(mx + nx * h)} ${r1(my + ny * h)} ${r1(tip[0])} ${r1(tip[1])}` +
    `Q${r1(mx - nx * h)} ${r1(my - ny * h)} ${r1(hilt[0] - nx * h)} ${r1(hilt[1] - ny * h)}Z`
  );
}

/** Centre line of a blade (for glint sweeps). */
export function bladeLine(hilt: Pt, tip: Pt, sori = 0.06): string {
  const dx = tip[0] - hilt[0];
  const dy = tip[1] - hilt[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const mx = (hilt[0] + tip[0]) / 2 + nx * len * sori;
  const my = (hilt[1] + tip[1]) / 2 + ny * len * sori;
  return `M${r1(hilt[0])} ${r1(hilt[1])}Q${r1(mx)} ${r1(my)} ${r1(tip[0])} ${r1(tip[1])}`;
}

/** Point along a→b at t, pushed sideways by off. */
export function along(a: Pt, b: Pt, t: number, off = 0): [number, number] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [a[0] + dx * t + (-dy / len) * off, a[1] + dy * t + (dx / len) * off];
}

/** Pointed sumi-e leaf, base at origin pointing along +x, length l, width w. */
export function leaf(l: number, w: number): string {
  return `M0 0C${r1(l * 0.2)} ${r1(-w)} ${r1(l * 0.6)} ${r1(-w * 0.9)} ${r1(l)} 0C${r1(l * 0.6)} ${r1(w * 0.55)} ${r1(l * 0.2)} ${r1(w * 0.7)} 0 0Z`;
}

export function star(cx: number, cy: number, outer: number, inner: number, n = 4, rot = 0): string {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (Math.PI * i) / n;
    d += `${i === 0 ? "M" : "L"}${r1(cx + Math.cos(a) * r)} ${r1(cy + Math.sin(a) * r)}`;
  }
  return d + "Z";
}
