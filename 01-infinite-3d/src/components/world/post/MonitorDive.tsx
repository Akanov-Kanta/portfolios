"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Frustum, HalfFloatType, Matrix4, Mesh, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Sphere, Vector2, Vector3, Vector4, WebGLRenderTarget } from "three";
import { DIVE_OFFSET, SCREEN_C, SCREEN_N, SCREEN_R, SCREEN_ROT_Y, SCREEN_SIZE, dive } from "../scenes/dive";
import { PALETTE } from "../theme";
import { Offscreen } from "./offscreen";

/** portal render scale vs the drawing buffer (the screen is small until the last few frames) */
const SCALE = 0.6;
/** scissor margin around the screen's projected footprint (render-target px): covers bilinear taps */
const SCISSOR_PAD = 2;

/** the portal quad's four corners (world), exactly where MonitorDive lays it */
const CORNERS = [-1, 1].flatMap((sx) =>
  [-1, 1].map((sy) =>
    SCREEN_C.clone()
      .addScaledVector(SCREEN_N, 0.003)
      .addScaledVector(SCREEN_R, (sx * SCREEN_SIZE[0]) / 2)
      .add(new Vector3(0, (sy * SCREEN_SIZE[1]) / 2, 0)),
  ),
);

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// the portal samples the void render at its own SCREEN position (gl_FragCoord), so the monitor reads
// as a window: at the flip the screen covers the frame and the frame IS the void render.
// While it fades in over the code texture: row-wise glitch wipe + an ice edge on the wipe front.
const fragmentShader = /* glsl */ `
uniform sampler2D tPortal;
uniform vec2 uRes;
uniform float uMix;
uniform float uTime;
uniform vec3 uIce;
varying vec2 vUv;
float h(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main() {
  vec3 c = texture2D(tPortal, gl_FragCoord.xy / uRes).rgb;
  float row = floor(vUv.y * 48.0);
  float front = uMix * 1.3 - 0.15 + (h(vec2(row, floor(uTime * 14.0))) - 0.5) * 0.3 * (1.0 - uMix);
  float a = step(1.0 - vUv.y, front);
  float edge = (1.0 - smoothstep(0.0, 0.05, abs(1.0 - vUv.y - front))) * (1.0 - uMix);
  a = uMix >= 0.999 ? 1.0 : a;
  gl_FragColor = vec4(c + uIce * edge * 0.6, max(a, edge * 0.8));
}`;

/**
 * High tier: the room monitor (monitorR) shows a live render of the projects void through a portal
 * quad laid 3 mm over its code screen, rendered from the live camera translated by DIVE_OFFSET
 * (scenes/dive.ts). CameraRig flies through the screen and switches sides when the screen fills the
 * frame. The render target is allocated at mount / resize and kept across laps (allocating it lazily
 * and freeing it on exit made every entry re-allocate mid-flight); the render is skipped when the screen is
 * off-frame and scissored to the screen's projected footprint, the only pixels the quad samples.
 * Priority 0.5: after CameraRig and every default-priority update (motion uniforms), before the
 * composer (1).
 */
export function MonitorDive() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const rt = useMemo(() => new WebGLRenderTarget(2, 2, { type: HalfFloatType, depthBuffer: true, stencilBuffer: false }), []);
  const cam = useMemo(() => new PerspectiveCamera(), []);
  const off = useMemo(() => new Offscreen(), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { tPortal: { value: rt.texture }, uRes: { value: new Vector2(1, 1) }, uMix: { value: 0 }, uTime: { value: 0 }, uIce: { value: new Color(PALETTE.ice) } },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        fog: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
    [rt],
  );
  const quad = useMemo(() => {
    const m = new Mesh(new PlaneGeometry(SCREEN_SIZE[0], SCREEN_SIZE[1]), material);
    m.position.copy(SCREEN_C).addScaledVector(SCREEN_N, 0.003);
    m.rotation.set(0, SCREEN_ROT_Y, 0);
    m.visible = false;
    m.frustumCulled = false;
    m.renderOrder = 10;
    m.updateMatrixWorld();
    return m;
  }, [material]);
  const st = useRef({ live: false, frustum: new Frustum(), m: new Matrix4(), sphere: new Sphere(SCREEN_C.clone(), Math.hypot(SCREEN_SIZE[0], SCREEN_SIZE[1]) / 2), shift: new Matrix4(), v: new Vector4() });

  useEffect(
    () => () => {
      rt.dispose();
      material.dispose();
      quad.geometry.dispose();
    },
    [rt, material, quad],
  );

  // allocate the target at its real size now (and on resize), not on the first dive frame
  const w = Math.max(2, Math.round(size.width * dpr * SCALE));
  const h = Math.max(2, Math.round(size.height * dpr * SCALE));
  useEffect(() => {
    rt.setSize(w, h);
    gl.initRenderTarget(rt);
  }, [gl, rt, w, h]);

  useFrame((state, dt) => {
    const s = st.current;
    // the flip frame: re-express the motion-stretch history in the new camera space, so stars and
    // glyphs don't smear across the 40 m translation (their hook already ran at priority 0)
    if (dive.flipTick === dive.tick) {
      s.shift.makeTranslation(-dive.flipDelta.x, -dive.flipDelta.y, -dive.flipDelta.z);
      for (const m of off.motionMatrices) m.multiply(s.shift);
    }
    const want = dive.on && !dive.void && dive.mix > 0.001;
    if (!dive.on) {
      s.live = false; // the target stays allocated: re-allocating it cost a hitch on every lap
      quad.visible = false;
      return;
    }
    if (!s.live) {
      s.live = true;
      off.scan(state.scene);
    }
    quad.visible = want;
    if (!want) {
      off.reset();
      return;
    }
    // off-frame (camera turned away early in the window): nothing to render
    camera.updateMatrixWorld();
    s.m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    s.frustum.setFromProjectionMatrix(s.m);
    if (!s.frustum.intersectsSphere(s.sphere)) {
      quad.visible = false;
      off.reset();
      return;
    }
    if (rt.width !== w || rt.height !== h) rt.setSize(w, h);
    // the portal camera: the live camera, translated through the screen
    cam.position.copy(camera.position).add(DIVE_OFFSET);
    cam.quaternion.copy(camera.quaternion);
    cam.projectionMatrix.copy(camera.projectionMatrix);
    cam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    // scissor to the screen's footprint: the quad samples tPortal at its own fragment positions only,
    // so texels outside it are never read (most of the target while the monitor is still small)
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, full = false;
    for (const c of CORNERS) {
      const v = s.v.set(c.x, c.y, c.z, 1).applyMatrix4(s.m);
      if (v.w <= 1e-4) {
        full = true; // a corner behind the eye (just before the flip): no bounded footprint
        break;
      }
      const x = (v.x / v.w) * 0.5 + 0.5, y = (v.y / v.w) * 0.5 + 0.5;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    if (!full) {
      const sx0 = Math.max(0, Math.floor(x0 * w) - SCISSOR_PAD), sx1 = Math.min(w, Math.ceil(x1 * w) + SCISSOR_PAD);
      const sy0 = Math.max(0, Math.floor(y0 * h) - SCISSOR_PAD), sy1 = Math.min(h, Math.ceil(y1 * h) + SCISSOR_PAD);
      full = (sx1 - sx0) * (sy1 - sy0) > 0.9 * w * h;
      rt.scissor.set(sx0, sy0, Math.max(0, sx1 - sx0), Math.max(0, sy1 - sy0));
    }
    rt.scissorTest = !full;
    off.render(state.gl, state.scene, cam, rt, SCALE, quad);
    const u = material.uniforms;
    gl.getDrawingBufferSize(u.uRes!.value as Vector2);
    u.uMix!.value = dive.mix;
    u.uTime!.value += dt;
  }, 0.5);

  return <primitive object={quad} />;
}
