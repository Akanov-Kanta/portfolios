"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, ShaderMaterial, type Points } from "three";
import { rng } from "./rng";
import { VOID, STACK_BOTTOM } from "./layout";
import { frame } from "../state/world-store";
import { MOTION_GLSL, useMotionUniforms } from "./Sky";
import { cull } from "./station-window";

const CHARS = "01<>{}[]/=+*#$%&?:;ABCDEFXYZabcdefxyz0123456789";
const GRID = 8; // 8x8 glyph atlas

function makeAtlas(): CanvasTexture {
  const size = 512, cell = size / GRID;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#fff";
  ctx.font = `${cell * 0.8}px ui-monospace, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < GRID * GRID; i++) {
    const ch = CHARS[i % CHARS.length];
    ctx.fillText(ch, (i % GRID) * cell + cell / 2, Math.floor(i / GRID) * cell + cell / 2);
  }
  const t = new CanvasTexture(c);
  t.flipY = false;
  return t;
}

/** Slowly falling mono glyphs in the project void (igloo's "tech" particles, our way). */
export function GlyphRain({ count }: { count: number }) {
  const ref = useRef<Points>(null!);
  const atlas = useMemo(() => makeAtlas(), []);
  useEffect(() => () => atlas.dispose(), [atlas]);
  const { positions, glyph, speed } = useMemo(() => {
    const r = rng(77);
    const p = new Float32Array(count * 3), g = new Float32Array(count), sp = new Float32Array(count);
    const top = VOID.y + 6, bottom = STACK_BOTTOM - 8;
    for (let i = 0; i < count; i++) {
      p[i * 3] = VOID.x + (r() - 0.5) * 26;
      p[i * 3 + 1] = bottom + r() * (top - bottom);
      p[i * 3 + 2] = VOID.z + (r() - 0.5) * 22 - 4;
      g[i] = Math.floor(r() * GRID * GRID);
      sp[i] = 0.3 + r() * 0.9;
    }
    return { positions: p, glyph: g, speed: sp };
  }, [count]);
  const motion = useMotionUniforms();
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { ...motion, uAtlas: { value: atlas }, uTime: { value: 0 }, uDpr: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
          attribute float aGlyph; attribute float aSpeed;
          varying float vGlyph; varying float vFade; varying vec2 vDir; varying float vStretch;
          uniform float uDpr;
          ${MOTION_GLSL}
          void main() {
            vGlyph = aGlyph;
            vec4 w = modelMatrix * vec4(position, 1.0);
            vec4 mv = viewMatrix * w;
            gl_Position = projectionMatrix * mv;
            float base = 22.0 * uDpr * (8.0 / max(1.0, -mv.z));
            // velocity streak: the sprite grows along the travel direction, the glyph is stretched to fill it
            float len = motionStretch(w, gl_Position, vDir);
            gl_PointSize = base + len;
            vStretch = (base + len) / base;
            vFade = smoothstep(40.0, 6.0, -mv.z) * (0.35 + 0.65 * fract(aSpeed * 7.0));
          }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D uAtlas; varying float vGlyph; varying float vFade; varying vec2 vDir; varying float vStretch;
          void main() {
            float g = 8.0;
            vec2 cell = vec2(mod(vGlyph, g), floor(vGlyph / g));
            // point coords → glyph coords: undo the stretch along the (screen, y-up) travel direction
            vec2 q = (gl_PointCoord - 0.5) * vStretch;
            vec2 dir = vec2(vDir.x, -vDir.y);
            vec2 perp = vec2(-dir.y, dir.x);
            q = dir * (dot(q, dir) / vStretch) + perp * dot(q, perp);
            if (abs(q.x) > 0.5 || abs(q.y) > 0.5) discard;
            vec2 uv = (cell + q + 0.5) / g;
            float a = texture2D(uAtlas, uv).r * vFade / mix(1.0, vStretch, 0.35);
            if (a < 0.03) discard;
            gl_FragColor = vec4(vec3(0.42, 0.95, 1.0) * a, a * 0.8);
          }`,
      }),
    [atlas, motion],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame((state, dt) => {
    const pts = ref.current;
    // phones: drawn (and animated) only inside the void window
    if (pts.visible !== cull.void) pts.visible = cull.void;
    if (!cull.void) return;
    material.uniforms.uDpr.value = state.viewport.dpr;
    if (frame.freeze) return;
    const attr = pts.geometry.getAttribute("position") as import("three").BufferAttribute;
    const arr = attr.array as Float32Array;
    const top = VOID.y + 6, bottom = STACK_BOTTOM - 8;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= speed[i] * dt;
      if (arr[i * 3 + 1] < bottom) arr[i * 3 + 1] = top;
    }
    attr.needsUpdate = true;
  });
  return (
    <points ref={ref} material={material} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aGlyph" args={[glyph, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speed, 1]} />
      </bufferGeometry>
    </points>
  );
}
