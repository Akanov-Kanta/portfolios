/**
 * Tiny 1D value noise + 3-octave fBm for the steadicam drift. Pure math, no dependency.
 * Output is roughly in [-1, 1], smooth (quintic interpolation), and deterministic per seed.
 */
function hash(i: number, seed: number): number {
  // integer hash → [-1, 1]
  let h = (i * 374761393 + seed * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * f * (f * (f * 6 - 15) + 10);
  const a = hash(i, seed), b = hash(i + 1, seed);
  return a + (b - a) * u;
}

/** 3 octaves, lacunarity 2.03 (avoids aligned lattice points), gain 0.5; normalised to ~[-1, 1] */
export function fbm1(x: number, seed = 0): number {
  return (noise1(x, seed) + 0.5 * noise1(x * 2.03 + 17.1, seed + 1) + 0.25 * noise1(x * 4.07 + 41.3, seed + 2)) / 1.75;
}
