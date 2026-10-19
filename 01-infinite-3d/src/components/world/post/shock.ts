/**
 * Intro "world materialises" shockwave trigger. Pure (no three), so IntroLoader, which ships in the
 * first-load bundle, can fire it without pulling the world chunk in. GlitchCutEffect reads it.
 */
export const shock = {
  /** performance.now() when it fired; negative = never */
  t0: -1,
  /** origin in UV (0..1, y up) */
  x: 0.5,
  y: 0.5,
};

/** Fire once from a viewport point (CSS px). The caller checks reduced motion / static. */
export function triggerShock(clientX: number, clientY: number) {
  shock.x = clientX / Math.max(1, innerWidth);
  shock.y = 1 - clientY / Math.max(1, innerHeight);
  shock.t0 = performance.now();
}
