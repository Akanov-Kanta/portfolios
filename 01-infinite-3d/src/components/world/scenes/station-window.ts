/**
 * Station culling (phones only): each scene group draws, and runs its per-frame CPU work, only
 * inside its window of the wrapped lap t. Pure (no three / React / DOM), unit-tested.
 *
 * For reference, STATION_T: hero 0, about 0.222, projects 0.444, contact 0.667; the gates sit at
 * the control points in between (1/9, 3/9, 5/9, 7/9, 8/9).
 *
 * HARD RULE: never hide a light or an ancestor of one. three keys every lit program on the visible
 * light count, so hiding a light relinks shaders mid-flight. cullTargets() only ever returns
 * light-free subtrees, so the scenes can hand it any root.
 */

export type Span = readonly [number, number];

/** inclusive spans on the wrapped lap [0, 1) */
export const WINDOWS = {
  /** Room kit, code screens, Dust, LightShafts, the room ContactShadows */
  room: [[0.7, 1], [0, 0.42]],
  /** Devices, VoidDressing, GlyphRain */
  void: [[0.26, 0.62]],
  /** Portal rings and tunnel */
  portal: [[0.44, 0.7]],
  /** racks, LEDs, Halo, floor, IconCloud, the server ContactShadows. From the projects station on: the
   *  lower stops look down the portal at the orb (tuned against ?cull=0; the spec's start was 0.50) */
  server: [[0.44, 0.86]],
} as const satisfies Record<string, readonly Span[]>;
export type WindowId = keyof typeof WINDOWS;
/** each Gate is drawn within ± this of its own control-point t (and see gateShown) */
export const GATE_HALF = 0.08;
const IDS = Object.keys(WINDOWS) as WindowId[];

export const wrap01 = (t: number) => t - Math.floor(t);
/** shortest signed distance from a to b on the unit loop, in [-0.5, 0.5) */
export const loopDist = (a: number, b: number) => wrap01(b - a + 0.5) - 0.5;

export function inSpans(t: number, spans: readonly Span[]): boolean {
  const p = wrap01(t);
  for (const [a, b] of spans) if (p >= a && p <= b) return true;
  return false;
}
export const inWindow = (t: number, id: WindowId) => inSpans(t, WINDOWS[id]);
/** wrap-aware: is t within ±half of c? */
export const nearT = (t: number, c: number, half = GATE_HALF) => Math.abs(loopDist(c, t)) <= half;

/**
 * Live culling state. CameraRig writes it once per rendered frame (useFrame -50, before every
 * scene), scene useFrames read it. Everything shows while `on` is false: desktop, ?cull=0, and
 * before webglReady (Warmup compiles with the whole scene in place).
 */
export const cull = { on: false, t: 0, lag: 0, room: true, void: true, portal: true, server: true };
export type CullState = typeof cull;

/**
 * t is the mapped lap position, lag a damped copy that trails it like the damped camera. A group
 * shows when either is inside its window, so a fast flick never culls what the lagging camera
 * still sees.
 */
export function updateCull(t: number, lag: number, on: boolean, out: CullState = cull): CullState {
  out.on = on;
  out.t = t;
  out.lag = lag;
  for (const id of IDS) out[id] = !on || inWindow(t, id) || inWindow(lag, id);
  return out;
}

/**
 * A gate at control-point t gateT shows near its t, and also wherever a scene whose window contains
 * gateT shows: the rings hang in those scenes and are in view across them (the hero sees the monitor
 * gate at 3/9 through the whole hero → about flight). Tuned against ?cull=0. At rest the gates are
 * hidden anyway (Gate.tsx: no transition bell, no ring).
 */
export function gateShown(s: CullState, gateT: number): boolean {
  if (!s.on || nearT(s.t, gateT) || nearT(s.lag, gateT)) return true;
  for (const id of IDS) if (s[id] && inWindow(gateT, id)) return true;
  return false;
}

/** the structural part of an Object3D that culling touches */
export interface CullNode {
  visible: boolean;
  children: CullNode[];
  isLight?: boolean;
}

function hasLight(n: CullNode): boolean {
  if (n.isLight) return true;
  for (const c of n.children) if (hasLight(c)) return true;
  return false;
}

/** The largest light-free subtrees under root (never root itself): hiding them hides every mesh but no light. */
export function cullTargets(root: CullNode, out: CullNode[] = []): CullNode[] {
  for (const c of root.children) {
    if (!hasLight(c)) out.push(c);
    else if (!c.isLight) cullTargets(c, out);
  }
  return out;
}

/**
 * Show / hide everything under root except its lights. Call it only when the state flips: it walks
 * the subtree (late mounts, e.g. the orb cloud, are picked up on the next flip).
 */
export function setCulled(root: CullNode | null | undefined, show: boolean): void {
  if (!root) return;
  for (const n of cullTargets(root)) n.visible = show;
}
