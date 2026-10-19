import type { Camera, Object3D } from "three";
import { STATION_T } from "../path/stations";
import { frame } from "../state/world-store";
import { smoothstep as smooth } from "../math";

/**
 * Server-room floor reflection plumbing, shared by ServerFloor (writer) and the objects it mirrors.
 * The reflection camera renders ONLY this layer, so the pass costs a handful of draw calls
 * (orb logo, halo, LED strip) instead of the whole world.
 */
export const REFL_LAYER = 5;

/** ref callback: add an object to the reflection layer (it stays on layer 0 for the main pass) */
export const reflectable = (o: Object3D | null): void => {
  o?.layers.enable(REFL_LAYER);
};

/** true while `camera` is the floor's reflection camera (it sees the reflection layer only) */
export const isReflectionCamera = (camera: Camera): boolean => camera.layers.mask === 1 << REFL_LAYER;

/**
 * Per-pass info for screen-size dependent shaders (point sprites): the reflection target is much
 * smaller than the drawing buffer, so gl_PointSize must scale by `pxScale` there. Single writer: ServerFloor.
 */
export const reflectPass = { pxScale: 1 };

/**
 * 0..1 proximity of the camera to the contact station along the loop (1 from the tunnel exit to
 * the start of the climb out, 0 elsewhere). Anything contact-only gates its per-frame work on this.
 */
export function contactNear(t = frame.t): number {
  const d = Math.abs((((t - STATION_T.contact) % 1) + 1.5) % 1 - 0.5);
  return 1 - smooth(0.035, 0.075, d);
}
