/**
 * Phone render policy and quality ladder (worldStore.profile === "phone", touch-wrap / finite).
 * Pure: the clock and every input are injected, so vitest drives it with synthetic frames. The
 * WorldCanvas phone tick applies it; the desktop tick never calls into this module.
 *
 *   motion   60 fps (30 once thermally locked) while anything moves (see MotionInput)
 *   ambient  30 fps for DUR.ambient after the last motion (damping settles, drift fades)
 *   held     no advance at all: the last frame stays on the canvas
 * Frames render only when now - lastRender >= interval - 2 ms, so 90 / 120 Hz panels never double
 * the GPU cost. The scene advances on a virtual clock (≤ 50 ms per render), so springs, spins and
 * uTime never jump after a held stretch or a sleep.
 */

export const MOTION_MS = 1000 / 60;
export const SLOW_MS = 1000 / 30;
/** a frame is due this much before its interval (rAF timestamps jitter) */
export const TOLERANCE_MS = 2;
/** |velocityPx| above this (px per frame) counts as scrolling ... */
export const VEL_MIN = 0.3;
/** ... for this long after it was last seen */
export const VEL_WINDOW_MS = 250;
/** the virtual clock never steps further than this per render */
export const MAX_STEP_MS = 50;
/** two renders further apart than this are not consecutive (the ladder skips the pair) */
const CONSECUTIVE_MS = 100;

export type Phase = "motion" | "ambient" | "held";

/** Everything that keeps the phone rendering at full rate (frame / fx / store values, read per tick). */
export interface MotionInput {
  velocityPx: number;
  wakeUntil: number;
  cutUntil: number;
  frost: number;
  impulse: number;
  develop: number;
  flying: boolean;
  dirty: number;
  pointerLive: boolean;
}

export interface Policy {
  /** DUR.ambient: 30 fps this long after the last motion, then held */
  ambientMs: number;
  /** last time |velocityPx| exceeded VEL_MIN */
  velAt: number;
  /** last time the motion predicate held */
  motionAt: number;
  /** last render (ms), -Infinity before the first */
  lastRender: number;
  /** phase of the last render, for the ladder's consecutive-motion rule */
  lastRenderPhase: Phase | null;
  /** phase of the last tick (render or not), for the enter-ambient / enter-held edge */
  phase: Phase;
  /** virtual clock (ms) handed to R3F's advance */
  vt: number;
  /** thermal lock: motion cadence 30 fps for the rest of the session */
  locked: boolean;
}

export function createPolicy(ambientMs: number): Policy {
  return { ambientMs, velAt: -Infinity, motionAt: -Infinity, lastRender: -Infinity, lastRenderPhase: null, phase: "held", vt: 0, locked: false };
}

export function isMotion(p: Policy, now: number, m: MotionInput): boolean {
  if (Math.abs(m.velocityPx) > VEL_MIN) p.velAt = now;
  return (
    now - p.velAt < VEL_WINDOW_MS ||
    now < m.wakeUntil ||
    now < m.cutUntil ||
    m.frost > 0.001 ||
    Math.abs(m.impulse) > 0.02 ||
    m.develop < 1 ||
    m.flying ||
    m.dirty > 0 ||
    m.pointerLive
  );
}

/** Render interval for a phase; Infinity = held. */
export function intervalFor(phase: Phase, locked: boolean): number {
  if (phase === "motion") return locked ? SLOW_MS : MOTION_MS;
  return phase === "ambient" ? SLOW_MS : Infinity;
}

export interface Decision {
  phase: Phase;
  /** the phase this tick entered (null when unchanged): DPR changes are applied on "ambient" / "held" */
  entered: Phase | null;
  render: boolean;
  /** virtual clock to advance to (valid when render) */
  vt: number;
  /** ms since the previous render when both it and this one are consecutive motion frames, else 0 */
  motionFrameMs: number;
}

/**
 * One tick. Frozen ticks (sheet open, hidden tab, lost context) must not call this: they neither
 * render nor move the clock, so the next render steps the virtual clock by at most MAX_STEP_MS.
 */
export function decide(p: Policy, now: number, m: MotionInput): Decision {
  const motion = isMotion(p, now, m);
  if (motion) p.motionAt = now;
  const phase: Phase = motion ? "motion" : now - p.motionAt < p.ambientMs ? "ambient" : "held";
  const entered = phase !== p.phase ? phase : null;
  p.phase = phase;
  const since = now - p.lastRender;
  const render = since >= intervalFor(phase, p.locked) - TOLERANCE_MS;
  if (!render) return { phase, entered, render, vt: p.vt, motionFrameMs: 0 };
  const consecutive = phase === "motion" && p.lastRenderPhase === "motion" && since < CONSECUTIVE_MS;
  // first render: seed the clock with the real time (same first frame as the desktop tick)
  p.vt = Number.isFinite(since) ? p.vt + Math.min(since, MAX_STEP_MS) : now;
  p.lastRender = now;
  p.lastRenderPhase = phase;
  return { phase, entered, render, vt: p.vt, motionFrameMs: consecutive ? since : 0 };
}

/** Advance the virtual clock for a render outside decide() (the static dirty-frame path). */
export function stepClock(p: Policy, now: number): number {
  const since = now - p.lastRender;
  p.vt = Number.isFinite(since) ? p.vt + Math.min(since, MAX_STEP_MS) : now;
  p.lastRender = now;
  p.lastRenderPhase = null;
  return p.vt;
}

/* ---- Quality ladder (phones only; drei PerformanceMonitor stays on desktop) ---- */

/** mean frame time over a window above this declines */
export const DECLINE_MS = 20;
/** mean at or under this counts as steady */
export const STEADY_MS = 17.5;
/** one sample window: this much motion-frame time */
export const WINDOW_MS = 1000;
/** steady motion time before the first DPR step up (1 → 1.25) */
export const FIRST_STEP_MS = 2000;
/** steady motion time before any later step (1.25 → 1.5, a feature level back) */
export const NEXT_STEP_MS = 3000;
/** two floor declines within this lock the motion cadence at 30 fps */
export const LOCK_WINDOW_MS = 20000;

export interface Ladder {
  steps: readonly number[];
  /** highest step index this screen may use (1.5 only when devicePixelRatio >= 3) */
  top: number;
  /** wanted DPR step */
  idx: number;
  /** DPR step the canvas currently has */
  applied: number;
  featureLevel: 0 | 1 | 2;
  winSum: number;
  winN: number;
  /** steady motion time since the last change */
  steadyMs: number;
  /** times of recent floor declines */
  floors: number[];
  locked: boolean;
}

export function createLadder(steps: readonly number[], deviceDpr: number): Ladder {
  let top = 0;
  for (let i = 1; i < steps.length; i++) {
    const s = steps[i]!;
    if (s <= deviceDpr && (s < 1.5 || deviceDpr >= 3)) top = i;
  }
  return { steps, top, idx: 0, applied: 0, featureLevel: 2, winSum: 0, winN: 0, steadyMs: 0, floors: [], locked: false };
}

export type LadderEvent = "decline" | "incline" | "floor" | "lock" | null;

/**
 * Feed one consecutive motion frame. Windows close after WINDOW_MS of motion-frame time; the mean
 * decides. Decline: DPR down, then the feature level, then a floor decline (two within 20 s lock
 * 30 fps). Incline (reverse order): a feature level back after 3 s steady, else DPR 1 → 1.25 after
 * 2 s steady and → 1.5 (DPR ≥ 3 screens) after 3 more at 1.25. One DPR step is queued at a time.
 */
export function sampleFrame(l: Ladder, frameMs: number, now: number): LadderEvent {
  if (l.locked || !(frameMs > 0)) return null;
  l.winSum += frameMs;
  l.winN++;
  if (l.winSum < WINDOW_MS) return null;
  const span = l.winSum;
  const mean = span / l.winN;
  l.winSum = 0;
  l.winN = 0;
  if (mean > DECLINE_MS) {
    l.steadyMs = 0;
    // a queued step up is cancelled; a queued step down already answers these frames
    if (l.idx > l.applied) {
      l.idx = l.applied;
      return "decline";
    }
    if (l.idx < l.applied) return null;
    if (l.idx > 0) {
      l.idx--;
      return "decline";
    }
    if (l.featureLevel > 0) {
      l.featureLevel = (l.featureLevel - 1) as 0 | 1;
      return "decline";
    }
    l.floors = l.floors.filter((t) => now - t < LOCK_WINDOW_MS);
    l.floors.push(now);
    if (l.floors.length >= 2) {
      l.locked = true;
      return "lock";
    }
    return "floor";
  }
  if (mean > STEADY_MS) {
    l.steadyMs = 0;
    return null;
  }
  // steadiness counts only at the DPR the canvas really has: wait for a queued step to land
  if (l.idx !== l.applied) return null;
  l.steadyMs += span;
  if (l.featureLevel < 2) {
    if (l.steadyMs < NEXT_STEP_MS) return null;
    l.featureLevel = (l.featureLevel + 1) as 1 | 2;
    l.steadyMs = 0;
    return "incline";
  }
  if (l.idx >= l.top || l.steadyMs < (l.idx === 0 ? FIRST_STEP_MS : NEXT_STEP_MS)) return null;
  l.idx++;
  l.steadyMs = 0;
  return "incline";
}

/**
 * The DPR to apply now, or null. Call only on entering ambient / held (a resize reallocates every
 * target). Steadiness is measured afresh at the new DPR.
 */
export function takeDpr(l: Ladder): number | null {
  if (l.idx === l.applied) return null;
  l.applied = l.idx;
  l.steadyMs = 0;
  l.winSum = 0;
  l.winN = 0;
  return l.steps[l.idx]!;
}
