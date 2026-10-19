import type { Mapping } from "../state/world-store";

/**
 * Desktop project catch: wheel scrolling through the projects pauses on each project. When a wheel step would
 * carry Lenis's target across a project stop, the step is shortened to land exactly on it, and further wheel
 * input is swallowed until the page has settled there and held for CATCH_DWELL_MS. Wheel only, loop mode only:
 * nav clicks (lenis.scrollTo), the keyboard and phones (touch-settle.ts glides to the nearest stop) are untouched.
 */

/** how long a caught project holds after the scroll has settled on it */
export const CATCH_DWELL_MS = 200;
/** a catch never swallows input for longer than this, settled or not */
export const CATCH_MAX_MS = 1100;
/** the page counts as settled on a stop once it is this close (px): the last few px of the ease are slow */
export const CATCH_SETTLE_PX = 12;

/**
 * Scroll positions where a project's device is centred: the camera parks on device i when the scroll is i
 * viewports into the projects hold (CameraRig: idx = vhIn), i.e. at each project article's top.
 */
export function projectStops(m: Mapping | null): number[] {
  const s = m?.segments.find((x) => x.from === "projects");
  if (!s || !m) return [];
  return Array.from({ length: s.stops }, (_, i) => s.start + i * m.vh);
}

/**
 * The first stop strictly past `from` and at or before `to` in the direction of travel, or null (pure;
 * project-catch.test.ts). Lenis's infinite target is unbounded, so stops repeat every `period` (the lap).
 */
export function crossedStop(from: number, to: number, stops: readonly number[], period: number): number | null {
  if (to === from || stops.length === 0 || !(period > 0)) return null;
  const forward = to > from;
  const base = Math.floor(from / period) * period;
  let best: number | null = null;
  for (const lap of [-1, 0, 1]) {
    for (const s of stops) {
      const y = s + base + lap * period;
      const hit = forward ? y > from && y <= to : y < from && y >= to;
      if (hit && (best === null || Math.abs(y - from) < Math.abs(best - from))) best = y;
    }
  }
  return best;
}
