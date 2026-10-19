import { frame } from "../state/world-store";
import { wrap01 } from "../scroll/anchors";

let flight: { from: number; delta: number; start: number; ms: number } | null = null;

/** Fly the shortest way round the loop to targetT. seconds = 0 cuts (reduced motion). */
export function flyTo(targetT: number, seconds = 1.4) {
  const from = frame.t;
  const delta = loopDelta(from, targetT); // in [-0.5, 0.5)
  if (Math.abs(delta) < 1e-4) return;
  frame.dirty = 3;
  if (seconds <= 0) {
    frame.t = wrap01(targetT);
    flight = null;
    return;
  }
  flight = { from, delta, start: performance.now(), ms: seconds * 1000 };
}

/** Shortest signed distance on the unit loop. */
export function loopDelta(from: number, to: number) {
  return ((to - from + 1.5) % 1) - 0.5;
}

/** A route flight is under way (the phone render policy keeps full rate while it is). */
export function isFlying(): boolean {
  return flight !== null;
}

/** Returns true while a flight owns frame.t. */
export function stepFlight(now: number): boolean {
  if (!flight) return false;
  const k = Math.min(1, (now - flight.start) / flight.ms);
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  frame.t = wrap01(flight.from + flight.delta * e);
  frame.transition = Math.sin(Math.PI * k) * 0.8;
  if (k >= 1) flight = null;
  return true;
}
