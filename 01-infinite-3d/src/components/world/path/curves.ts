import { CatmullRomCurve3, Vector3 } from "three";
import { CONTROL } from "./stations";

/**
 * Closed curves parameterised by t via getPoint (NOT getPointAt / arc length):
 * control point i sits exactly at t = i/N, so stations land on their poses and
 * position/target stay in sync.
 */
export const posCurve = new CatmullRomCurve3(CONTROL.map((c) => new Vector3(...c.pos)), true, "centripetal");
export const tgtCurve = new CatmullRomCurve3(CONTROL.map((c) => new Vector3(...c.target)), true, "centripetal");

const N = CONTROL.length;
/** FOV interpolated between the nearest control points that define one. */
export function fovAt(t: number): number {
  const p = ((t % 1) + 1) % 1;
  const x = p * N;
  const i0 = Math.floor(x) % N;
  const i1 = (i0 + 1) % N;
  const f0 = fovOf(i0), f1 = fovOf(i1);
  const k = x - Math.floor(x);
  const s = k * k * (3 - 2 * k);
  return f0 + (f1 - f0) * s;
}
function fovOf(i: number): number {
  // walk backwards to the previous control point that sets a fov
  for (let k = 0; k < N; k++) {
    const c = CONTROL[(i - k + N) % N];
    if (c.fov) return c.fov;
  }
  return 40;
}
