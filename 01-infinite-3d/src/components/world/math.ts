/** Scalar easing helpers shared by the scroll layer, HUD, scenes and audio. */

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Hermite 0 → 1 as x goes e0 → e1 (GLSL smoothstep), clamped outside the edges. */
export const smoothstep = (e0: number, e1: number, x: number) => {
  const k = clamp01((x - e0) / (e1 - e0));
  return k * k * (3 - 2 * k);
};

/** Perlin's smootherstep on [0, 1] (zero 1st and 2nd derivatives at both ends), input clamped. */
export const smootherstep = (x: number) => {
  const k = clamp01(x);
  return k * k * k * (k * (k * 6 - 15) + 10);
};
