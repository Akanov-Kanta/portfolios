"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import { HalfFloatType, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { frame, isCalm, worldStore } from "../state/world-store";
import { fovAt, posCurve, tgtCurve } from "../path/curves";
import { STATION_T } from "../path/stations";
import { STACK_BOTTOM, VOID } from "../scenes/layout";
import { fx } from "../theme";
import type { GlitchCutEffect } from "./GlitchCutEffect";
import { Offscreen } from "./offscreen";
import { smoothstep as smooth } from "../math";

/** vertical lift CameraRig adds when landing in the projects void (first device) */
const STACK_LIFT = VOID.y - STACK_BOTTOM;
/** only the ice (frost) boundary gets the dual render; the others keep their single-frame flavour */
const ICE_FROM = "about", ICE_TO = "projects";
/** window progress over which the next-pose camera converges onto the live camera */
const CONVERGE_FROM = 0.72, CONVERGE_TO = 0.94;

/**
 * Dual-render diagonal ice cut on about -> projects: render the scene from the NEXT station's pose
 * into a half-res target and hand it to GlitchCut, which shows it past the diagonal cut. Mounted by
 * Post when TIERS[tier].iceCut and the tier doesn't run the monitor dive (high uses the dive; the cut
 * stays as its fallback with ?dive=0). Outside the window nothing renders.
 *
 * No pop at the ends: the weight is a continuous function of the bell (0 at both ends) times a
 * damped gate, GlitchCut BLENDS toward the render by it (never hard-switches sides), and late in the
 * window the second camera converges onto the live camera, so the fade-out crosses between two
 * renders of the same view. Scroll direction and the loop wrap don't matter: it is all a function of
 * the scroll position inside this window.
 */
export function IceCutRender({ effect }: { effect: GlitchCutEffect }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const w = Math.max(2, Math.round((size.width * dpr) / 2));
  const h = Math.max(2, Math.round((size.height * dpr) / 2));
  const fbo = useFBO(w, h, { type: HalfFloatType, depthBuffer: true, stencilBuffer: false, samples: 0 });
  const cam = useMemo(() => new PerspectiveCamera(40, 1, 0.1, 160), []);
  const st = useRef({ target: new Vector3(), pos: new Vector3(), q: new Quaternion(), gate: 0, live: false });
  const off = useMemo(() => new Offscreen(), []);

  useEffect(() => () => effect.setIceCut(null, 0), [effect]);

  // priority 0.5: after CameraRig (-50) and default-priority updates (motion uniforms), before the composer (1)
  useFrame((state, dt) => {
    const s = st.current;
    const inWindow = worldStore.getState().isHome && frame.segFrom === ICE_FROM && frame.segTo === ICE_TO;
    // gate: feature level / calm / route changes fade the cut instead of cutting it
    const want = inWindow && fx.featureLevel === 2 && !isCalm();
    s.gate += ((want ? 1 : 0) - s.gate) * (1 - Math.exp(-10 * dt));
    if (!want && s.gate < 0.002) s.gate = 0;
    const bell = smooth(0.05, 0.15, frame.transition);
    const weight = inWindow ? bell * s.gate : 0;
    if (weight <= 0.001) {
      effect.setIceCut(null, 0);
      s.live = false;
      return;
    }
    if (!s.live) {
      s.live = true;
      off.scan(state.scene);
    }
    const t1 = STATION_T[ICE_TO];
    posCurve.getPoint(t1, s.pos);
    tgtCurve.getPoint(t1, s.target);
    // CameraRig lands on the first device (lifted from the curve's pose on the last one)
    s.pos.y += STACK_LIFT;
    s.target.y += STACK_LIFT;
    cam.position.copy(s.pos);
    cam.lookAt(s.target);
    cam.fov = fovAt(t1);
    cam.aspect = size.width / Math.max(1, size.height);
    cam.zoom = Math.min(1, cam.aspect * 1.25);
    // late in the window, converge onto the live camera (pose + lens), so the fade-out is seamless
    const c = smooth(CONVERGE_FROM, CONVERGE_TO, frame.local);
    if (c > 0) {
      camera.updateMatrixWorld();
      s.q.copy(cam.quaternion);
      cam.position.lerp(camera.position, c);
      cam.quaternion.copy(s.q).slerp(camera.quaternion, c);
      cam.fov += (camera.fov - cam.fov) * c;
      cam.zoom += (camera.zoom - cam.zoom) * c;
      cam.aspect = camera.aspect;
    }
    cam.updateProjectionMatrix();
    off.render(state.gl, state.scene, cam, fbo, 0.5);
    effect.setIceCut(fbo.texture, weight);
  }, 0.5);
  return null;
}
