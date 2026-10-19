import { Vector3, type Camera } from "three";
import { ROOM, STACK_BOTTOM, VOID } from "./layout";
import { STATION_T } from "../path/stations";
import { posCurve, tgtCurve } from "../path/curves";
import { frame, worldStore } from "../state/world-store";
import { fx } from "../theme";
import { smootherstep } from "../math";

/**
 * "Enter the monitor" composite dive (high tier), Active Theory style.
 *
 * The right-hand room monitor (ROOM tag monitorR) becomes a PORTAL into the projects void:
 * its screen shows a live render of the void from a secondary camera that is the live camera
 * translated by DIVE_OFFSET (post/MonitorDive.tsx). On about -> projects, CameraRig replaces the
 * curve with a dive path that runs straight through the screen centre. The path is expressed in
 * ROOM coordinates the whole way (the void half is the void pose minus DIVE_OFFSET, i.e. "behind"
 * the screen), so the damped camera never jumps. The rendered camera adds DIVE_OFFSET once the
 * damped camera is within FLIP_DIST of the screen plane: at that instant the screen fills the frame
 * and shows exactly what the translated camera sees, so the switch from room to void is invisible.
 *
 * Pure (three maths only, no React). Medium / low / static never enable it.
 */

// the MonitorScreen plane Room.tsx lays over the Kenney computerScreen (piece-local metres, piece scale 1)
const LOCAL: [number, number, number] = [0.39, 0.34, -0.052];
export const SCREEN_SIZE: [number, number] = [0.66, 0.4];
const mon = ROOM.find((p) => p.tag === "monitorR")!;
const ry = mon.rotation?.[1] ?? 0;
const cy = Math.cos(ry), sy = Math.sin(ry);
export const SCREEN_ROT_Y = ry;
/** screen centre (world), outward normal and right axis */
export const SCREEN_C = new Vector3(mon.position[0] + cy * LOCAL[0] + sy * LOCAL[2], mon.position[1] + LOCAL[1], mon.position[2] - sy * LOCAL[0] + cy * LOCAL[2]);
export const SCREEN_N = new Vector3(sy, 0, cy);
export const SCREEN_R = new Vector3(cy, 0, -sy);

const STACK_LIFT = VOID.y - STACK_BOTTOM;
const LIFT = new Vector3(0, STACK_LIFT, 0);
/** the first-device pose CameraRig lands on (curve pose on the last device + the stack lift) */
const P = posCurve.getPoint(STATION_T.projects).add(LIFT);
const PT = tgtCurve.getPoint(STATION_T.projects).add(LIFT);
/** where the screen plane "opens" in the void: 5 m behind and a little above the first-device pose */
const E = P.clone().add(new Vector3(0.35, 0.7, 5));
/** room -> void translation of the portal */
export const DIVE_OFFSET = E.clone().sub(SCREEN_C);

const A0 = posCurve.getPoint(STATION_T.about);
const T0 = tgtCurve.getPoint(STATION_T.about);
/** tangent length at the screen (same both sides, so the speed is continuous through it) */
const C1 = 1.4;
/** look-ahead through the screen */
const LOOK = 3;
const RA1 = A0.clone().lerp(SCREEN_C, 0.35);
const RA2 = SCREEN_C.clone().addScaledVector(SCREEN_N, C1);
const RT1 = SCREEN_C.clone().addScaledVector(SCREEN_N, -LOOK);
const VA1 = E.clone().addScaledVector(SCREEN_N, -C1);
const VA2 = P.clone().add(new Vector3(0, 0, 1.5));
const VT0 = E.clone().addScaledVector(SCREEN_N, -LOOK);

function bez(out: Vector3, a: Vector3, b: Vector3, c: Vector3, d: Vector3, u: number) {
  const v = 1 - u;
  const k0 = v * v * v, k1 = 3 * v * v * u, k2 = 3 * v * u * u, k3 = u * u * u;
  return out.set(
    a.x * k0 + b.x * k1 + c.x * k2 + d.x * k3,
    a.y * k0 + b.y * k1 + c.y * k2 + d.y * k3,
    a.z * k0 + b.z * k1 + c.z * k2 + d.z * k3,
  );
}

/**
 * Raw dive pose at window progress `local` (0 = about pose, 1 = first-device pose), in ROOM
 * coordinates: the void half is offset by -DIVE_OFFSET. Same smootherstep timing as the curve.
 * Returns the approach closeness 0..1 (1 at the screen) for parallax attenuation.
 */
export function divePose(local: number, outP: Vector3, outT: Vector3): number {
  const s = smootherstep(Math.min(1, Math.max(0, local)));
  if (s <= 0.5) {
    const u = s / 0.5;
    bez(outP, A0, RA1, RA2, SCREEN_C, u);
    const w = 1 - (1 - u) * (1 - u) * (1 - u);
    outT.copy(T0).lerp(RT1, w);
    return u * u;
  }
  const u = (s - 0.5) / 0.5;
  bez(outP, E, VA1, VA2, P, u).sub(DIVE_OFFSET);
  const w = u * u * (3 - 2 * u);
  outT.copy(VT0).lerp(PT, w).sub(DIVE_OFFSET);
  return (1 - u) * (1 - u);
}

/** signed distance of a room-space point to the screen plane (positive in front of the screen) */
export const screenPlaneDist = (p: Vector3) =>
  (p.x - SCREEN_C.x) * SCREEN_N.x + (p.y - SCREEN_C.y) * SCREEN_N.y + (p.z - SCREEN_C.z) * SCREEN_N.z;

/**
 * Plane distance at which the rendered camera switches to the void: the screen must cover the
 * whole frustum there (with room for parallax / look lag) and stay clear of the 0.1 m near plane.
 */
export function flipDist(fovDeg: number, aspect: number, zoom: number): number {
  const tv = Math.tan((fovDeg * Math.PI) / 360) / Math.max(1e-3, zoom);
  const byW = (0.7 * SCREEN_SIZE[0] * 0.5) / (tv * Math.max(0.2, aspect));
  const byH = (0.7 * SCREEN_SIZE[1] * 0.5) / tv;
  return Math.max(0.13, Math.min(0.2, byW, byH));
}

/** below this plane distance the flip is forced (just above the camera's 0.1 m near plane) */
export const FLIP_FORCE = 0.115;
const _o = new Vector3(), _d = new Vector3(), _h = new Vector3();
const CORNERS: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
/**
 * Does the screen rect cover the whole frustum of `camera` (room space, matrices up to date)?
 * The flip waits for it, so a fast flick that arrives off-axis never switches with a bezel in frame.
 */
export function screenCoversView(camera: Camera): boolean {
  _o.setFromMatrixPosition(camera.matrixWorld);
  const pd = screenPlaneDist(_o);
  if (pd <= 0) return false;
  for (const [x, y] of CORNERS) {
    _d.set(x, y, 0.5).applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld).sub(_o);
    const dn = _d.dot(SCREEN_N);
    if (dn >= -1e-6) return false;
    _h.copy(_o).addScaledVector(_d, -pd / dn).sub(SCREEN_C);
    if (Math.abs(_h.dot(SCREEN_R)) > SCREEN_SIZE[0] / 2 || Math.abs(_h.y) > SCREEN_SIZE[1] / 2) return false;
  }
  return true;
}

let noDive: boolean | null = null;
/** ?dive=0 turns the dive off (A/B against the ice cut, probes) */
export function diveAllowed(): boolean {
  if (noDive === null) noDive = typeof location !== "undefined" && new URLSearchParams(location.search).get("dive") === "0";
  return !noDive && worldStore.getState().tier === "high";
}

const T_FROM = STATION_T.about, T_TO = STATION_T.projects;
/**
 * The about -> projects window is live on the home scroll mapping (not a route flight, which owns
 * frame.t but leaves segFrom / segTo / local stale): frame.t must match the mapped value.
 */
export function inDiveWindow(): boolean {
  if (!worldStore.getState().isHome || frame.segFrom !== "about" || frame.segTo !== "projects") return false;
  const l = Math.min(1, Math.max(0, frame.local));
  const expect = T_FROM + (T_TO - T_FROM) * smootherstep(l);
  const d = frame.t - expect;
  return Math.abs(d - Math.round(d)) < 1e-4;
}

/**
 * Shared per-frame dive state. Single writer: CameraRig (priority -50). Readers: MonitorDive (the
 * portal render), GlitchCut (the flip pulse), IceCutRender (stands down while the dive owns the boundary).
 */
export const dive = {
  /** CameraRig is flying the dive path this frame */
  on: false,
  /** the rendered camera is on the void side of the portal (offset applied) */
  void: false,
  /** rendered offset this frame: DIVE_OFFSET on the void side, else 0 */
  offset: new Vector3(),
  /** 0..1 how much of the screen is the portal (fades the code texture out early in the window) */
  mix: 0,
  /** frame counter (CameraRig increments it every frame) and the frame of the last room<->void flip */
  tick: 0,
  flipTick: -1,
  /** offset change applied on the flip frame (+DIVE_OFFSET entering the void, -DIVE_OFFSET leaving) */
  flipDelta: new Vector3(),
  /** 0..1 closeness of the damped camera to the flip distance, either side (GlitchCut's shard pulse) */
  near: 0,
  /** fx.featureLevel latched when the window was entered (the ladder can't pull the portal mid-dive) */
  level: 2 as 0 | 1 | 2,
};

let inWindow = false;
/**
 * Gate for this frame: the feature level is latched when the window is entered (the dive needs the
 * full level, it costs an extra scene render), so the adaptive ladder never starts or pulls it mid-dive.
 */
export function diveGate(want: boolean): boolean {
  if (want && !inWindow) dive.level = fx.featureLevel;
  inWindow = want;
  return want && dive.level === 2;
}
