/**
 * Deterministic PRNG (mulberry32). Procedural art must render the same on the server and the client,
 * so anything generated during render uses a seeded stream instead of Math.random().
 */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** uniform in [min, max) */
    range: (min: number, max: number) => min + (max - min) * next(),
    /** uniform in [-amp, amp) */
    spread: (amp: number) => (next() * 2 - 1) * amp,
    int: (min: number, max: number) => Math.floor(min + (max - min + 1) * next()),
  };
}

/** Round for compact, stable SVG path strings. */
export const r2 = (n: number) => Math.round(n * 100) / 100;
