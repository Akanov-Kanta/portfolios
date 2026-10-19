import { rng, r2 } from "@/lib/random";

/** Viewbox the shard field is authored in (sliced to cover the viewport). */
export const SHARD_VIEW = { w: 1600, h: 1000 } as const;

export interface Shard {
  points: string;
  /** resting centre (viewBox units) */
  x: number;
  y: number;
  /** which edge it flies in from */
  side: -1 | 1;
  rot: number;
  opacity: number;
}

export interface Streak {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  side: -1 | 1;
  opacity: number;
}

/**
 * Thin angular glass shards (3–4 points, long axis 40–220, width 3–14, a kink on one side) resting
 * mostly toward the edges, plus a few white streak lines. Seeded, so SSR and client agree.
 */
export function shardField(seed = 5, count = 14, streaks = 6) {
  const R = rng(seed * 31337 + 1);
  const shards: Shard[] = [];
  for (let i = 0; i < count; i++) {
    const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
    const L = R.range(40, 220);
    const w = R.range(3, 14);
    const kink = R.range(-0.4, 0.4) * w;
    const four = R.next() < 0.6;
    const pts: [number, number][] = four
      ? [[-L / 2, 0], [-L * 0.1, -w / 2 + kink], [L / 2, R.spread(w * 0.3)], [L * 0.15, w / 2]]
      : [[-L / 2, R.spread(w * 0.3)], [L / 2, -w / 2], [L * R.range(-0.1, 0.3), w / 2 + kink]];
    // rest mostly in the outer thirds, a few crossing the middle
    const edge = R.next() < 0.75;
    const x = edge ? (side < 0 ? R.range(40, 560) : R.range(1040, 1560)) : R.range(500, 1100);
    shards.push({
      points: pts.map(([px, py]) => `${r2(px)},${r2(py)}`).join(" "),
      x: r2(x),
      y: r2(R.range(60, 940)),
      side,
      rot: r2(R.range(-70, 70)),
      opacity: r2(R.range(0.6, 0.95)),
    });
  }
  const lines: Streak[] = [];
  for (let i = 0; i < streaks; i++) {
    const side: -1 | 1 = R.next() < 0.5 ? -1 : 1;
    const y = R.range(80, 920);
    const len = R.range(160, 520);
    const x1 = side < 0 ? R.range(0, 400) : R.range(1000, 1500);
    const tilt = R.spread(0.25);
    lines.push({ x1: r2(x1), y1: r2(y), x2: r2(x1 + len), y2: r2(y + len * tilt), side, opacity: r2(R.range(0.3, 0.8)) });
  }
  return { shards, lines };
}
