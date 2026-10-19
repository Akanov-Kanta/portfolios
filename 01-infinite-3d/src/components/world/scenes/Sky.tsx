"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, Matrix4, ShaderMaterial, Vector2 } from "three";
import { rng } from "./rng";
import { frame, isCalm } from "../state/world-store";

/**
 * "Velocity is power": per-point screen-space motion from last frame's view-projection, so points
 * can stretch along their actual travel direction. uVel = frame.vNorm (0 in static / freeze), so
 * streaks only exist while scrolling fast. Shared by Sky and GlyphRain; no per-frame allocation.
 */
export function useMotionUniforms() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const u = useMemo(() => ({ uPrevVP: { value: new Matrix4() }, uVel: { value: 0 }, uRes: { value: new Vector2(1, 1) } }), []);
  const st = useRef({ last: new Matrix4(), cur: new Matrix4(), init: false });
  useFrame(() => {
    const s = st.current;
    camera.updateMatrixWorld();
    s.cur.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    u.uPrevVP.value.copy(s.init ? s.last : s.cur);
    s.last.copy(s.cur);
    s.init = true;
    gl.getDrawingBufferSize(u.uRes.value);
    u.uVel.value = isCalm() ? 0 : Math.min(1, frame.vNorm);
  });
  return u;
}

/** GLSL: screen-space motion of `world` in px this frame → vDir / stretch length (needs the motion uniforms). */
export const MOTION_GLSL = /* glsl */ `
  uniform mat4 uPrevVP; uniform float uVel; uniform vec2 uRes;
  float motionStretch(vec4 world, vec4 clip, out vec2 dir) {
    vec4 prev = uPrevVP * world;
    dir = vec2(1.0, 0.0);
    if (prev.w <= 0.0 || clip.w <= 0.0 || uVel <= 0.0) return 0.0;
    vec2 d = (clip.xy / clip.w - prev.xy / prev.w) * 0.5 * uRes;
    float l = length(d);
    if (l < 1e-3) return 0.0;
    dir = d / l;
    return min(l * 1.6, 56.0) * uVel;
  }`;

/** Star field on a big shell around everything (visible through the window and in the void). */
export function Sky({ count }: { count: number }) {
  const { positions, colors } = useMemo(() => {
    const p = new Float32Array(count * 3), c = new Float32Array(count * 3);
    const rand = rng(7);
    for (let i = 0; i < count; i++) {
      const r = 70 + rand() * 20;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      p[i * 3] = r * Math.sin(ph) * Math.cos(th);
      p[i * 3 + 1] = r * Math.cos(ph) - 10;
      p[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 15;
      const k = rand();
      c[i * 3] = 0.55 + 0.45 * k;
      c[i * 3 + 1] = 0.65 + 0.35 * k;
      c[i * 3 + 2] = 1;
    }
    return { positions: p, colors: c };
  }, [count]);
  const motion = useMotionUniforms();
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { ...motion, uSize: { value: 0.35 }, uPx: { value: 450 } },
        vertexShader: /* glsl */ `
          attribute vec3 aColor;
          uniform float uSize; uniform float uPx;
          varying vec3 vColor; varying vec2 vDir; varying float vRatio;
          ${MOTION_GLSL}
          void main() {
            vColor = aColor;
            vec4 w = modelMatrix * vec4(position, 1.0);
            vec4 mv = viewMatrix * w;
            gl_Position = projectionMatrix * mv;
            // PointsMaterial's size attenuation: size · (drawing-buffer height / 2) / depth
            float base = max(1.0, uSize * uPx / max(0.1, -mv.z));
            float len = motionStretch(w, gl_Position, vDir);
            gl_PointSize = base + len;
            vRatio = base / (base + len);
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vColor; varying vec2 vDir; varying float vRatio;
          void main() {
            vec2 p = gl_PointCoord * 2.0 - 1.0;
            p.y = -p.y;
            // ellipse: full length along the travel direction, star-sized across it
            vec2 e = vec2(dot(p, vDir), dot(p, vec2(-vDir.y, vDir.x)) / vRatio);
            float a = smoothstep(1.0, 0.45, length(e)) * mix(1.0, 0.6, 1.0 - vRatio);
            if (a < 0.01) discard;
            gl_FragColor = vec4(vColor, a * 0.9);
          }`,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [motion],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state) => {
    material.uniforms.uPx!.value = state.size.height * 0.5 * state.viewport.dpr;
  });
  return (
    <points frustumCulled={false} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
      </bufferGeometry>
    </points>
  );
}
