"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending, BackSide, CanvasTexture, Color, CylinderGeometry, DoubleSide, InstancedBufferAttribute, InstancedBufferGeometry,
  LinearFilter, MeshBasicMaterial, PlaneGeometry, RepeatWrapping, ShaderMaterial, SRGBColorSpace, type Mesh,
} from "three";
import { site } from "@/content/site";
import { frame, isCalm as frozen, worldStore } from "../state/world-store";
import { fx, PALETTE, projectAccent } from "../theme";
import { getNoiseTexture } from "./noise-texture";
import { STACK_BOTTOM, VOID } from "./layout";
import { rng } from "./rng";
import { cull } from "./station-window";

/* ---------- (a) blurry text cylinder ---------- */

const CYL_R = 12;
const CYL_H = VOID.y - STACK_BOTTOM + 18;

/**
 * A 3-pass box blur (≈ a gaussian of σ 12.5 px) of a grey raster in place: the type wall's blur where
 * ctx.filter is missing (WebKit, so every iPhone). Rows wrap (the texture repeats around the wall),
 * columns clamp. One-time, at mount.
 */
function blurGrey(ctx: CanvasRenderingContext2D, w: number, h: number, r: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const a = new Float32Array(w * h);
  const b = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = d[i * 4]!;
  const k = 1 / (2 * r + 1);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let s = 0;
      for (let x = -r; x <= r; x++) s += a[row + ((x + w) % w)]!;
      for (let x = 0; x < w; x++) {
        b[row + x] = s * k;
        s += a[row + ((x + r + 1) % w)]! - a[row + ((x - r + w) % w)]!;
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += b[Math.min(h - 1, Math.max(0, y)) * w + x]!;
      for (let y = 0; y < h; y++) {
        a[y * w + x] = s * k;
        s += b[Math.min(h - 1, y + r + 1) * w + x]! - b[Math.max(0, y - r) * w + x]!;
      }
    }
  }
  for (let i = 0; i < w * h; i++) d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = a[i]!;
  ctx.putImageData(img, 0, 0);
}

/** 'NAZAR AKANOV' + project names, drawn once, small and blurred (igloo's out-of-focus type wall). */
function makeTextTexture(): CanvasTexture {
  const w = 1024, h = 128;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  // ctx.filter is missing in WebKit: desktops keep the low resolution + linear filtering there (as
  // before); phones, where WebKit is the main engine and the lens zoom enlarges the wall, blur by hand
  const filter = "filter" in ctx;
  if (filter) ctx.filter = "blur(12px)";
  ctx.fillStyle = "#fff";
  ctx.font = `600 ${h * 0.5}px "Geist", system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  const words = ["NAZAR AKANOV", ...site.projects.map((p) => p.name.toUpperCase())];
  let x = 20;
  for (let i = 0; x < w; i++) {
    const s = words[i % words.length]!;
    ctx.fillText(s, x, h / 2);
    x += ctx.measureText(s).width + h * 0.6;
  }
  if (!filter && worldStore.getState().profile === "phone") blurGrey(ctx, w, h, 12);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  // one text row ≈ 2.6 m tall, 25 m long: glyphs keep their proportions on the r = 12 wall
  t.repeat.set(3, CYL_H / 2.6);
  t.minFilter = t.magFilter = LinearFilter;
  t.generateMipmaps = false;
  return t;
}


function TextCylinder() {
  const tex = useMemo(() => makeTextTexture(), []);
  const geo = useMemo(() => new CylinderGeometry(CYL_R, CYL_R, CYL_H, 64, 1, true), []);
  const mat = useMemo(
    () => new MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.08, side: BackSide, depthWrite: false, blending: AdditiveBlending, fog: false, toneMapped: false }),
    [tex],
  );
  useEffect(() => () => {
    tex.dispose();
    geo.dispose();
    mat.dispose();
  }, [tex, geo, mat]);
  const ref = useRef<Mesh>(null);
  const ice = useMemo(() => new Color().setStyle(PALETTE.ice, SRGBColorSpace), []);
  const tint = useMemo(() => new Color(), []);
  useFrame(() => {
    const m = ref.current;
    // phones: Devices hides the whole void outside its window; skip the work too
    if (!m || !cull.void) return;
    m.visible = fx.featureLevel > 0;
    const a = fx.mood.accent;
    mat.color.copy(ice).lerp(tint.setRGB(a[0], a[1], a[2], SRGBColorSpace), 0.5);
    // scroll-linked turn (reads as depth/parallax); held still in reduced motion
    if (!frozen()) m.rotation.y = frame.t * Math.PI * 1.5;
  });
  return <mesh ref={ref} geometry={geo} material={mat} position={[VOID.x, (VOID.y + STACK_BOTTOM) / 2, VOID.z]} renderOrder={-1} />;
}

/* ---------- (b) bokeh ---------- */

const bokehVertex = /* glsl */ `
  attribute vec3 aOffset; attribute float aSize; attribute float aSeed; attribute vec3 aColor;
  uniform sampler2D uNoise; uniform float uTime;
  varying vec2 vUv; varying vec3 vColor; varying float vPulse;
  void main() {
    vUv = uv; vColor = aColor;
    vPulse = 0.25 + 0.75 * texture2D(uNoise, vec2(aSeed, uTime * 0.015 + aSeed * 3.1)).b;
    vec4 mv = modelViewMatrix * vec4(aOffset, 1.0);
    mv.xy += position.xy * aSize;
    // soften when very close to the lens
    vPulse *= smoothstep(2.0, 7.0, -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const bokehFragment = /* glsl */ `
  varying vec2 vUv; varying vec3 vColor; varying float vPulse;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    // soft disc with a faintly brighter rim, like an out-of-focus highlight
    float a = smoothstep(1.0, 0.7, d) * (0.7 + 0.3 * smoothstep(0.3, 0.85, d));
    a *= 0.15 * vPulse;
    if (a < 0.002) discard;
    gl_FragColor = vec4(vColor, a);
  }`;

function Bokeh({ count }: { count: number }) {
  const geo = useMemo(() => {
    const g = new InstancedBufferGeometry();
    const quad = new PlaneGeometry(1, 1);
    g.index = quad.index;
    g.setAttribute("position", quad.getAttribute("position"));
    g.setAttribute("uv", quad.getAttribute("uv"));
    const r = rng(404);
    const off = new Float32Array(count * 3), size = new Float32Array(count), seed = new Float32Array(count), col = new Float32Array(count * 3);
    const ice = new Color().setStyle(PALETTE.ice, SRGBColorSpace), cyan = new Color().setStyle(PALETTE.screen, SRGBColorSpace), c = new Color();
    for (let i = 0; i < count; i++) {
      off[i * 3] = VOID.x + (r() - 0.5) * 30;
      off[i * 3 + 1] = STACK_BOTTOM - 6 + r() * (VOID.y - STACK_BOTTOM + 12);
      off[i * 3 + 2] = VOID.z - 14 + r() * 16;
      size[i] = 0.25 + r() * r() * 1.4;
      seed[i] = r();
      c.copy(ice).lerp(cyan, r());
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("aOffset", new InstancedBufferAttribute(off, 3));
    g.setAttribute("aSize", new InstancedBufferAttribute(size, 1));
    g.setAttribute("aSeed", new InstancedBufferAttribute(seed, 1));
    g.setAttribute("aColor", new InstancedBufferAttribute(col, 3));
    g.instanceCount = count;
    return g;
  }, [count]);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uNoise: { value: getNoiseTexture() }, uTime: { value: 0 } },
        vertexShader: bokehVertex,
        fragmentShader: bokehFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  );
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  useFrame((_, dt) => {
    if (!cull.void) return;
    if (!frozen()) mat.uniforms.uTime!.value += dt;
    geo.instanceCount = fx.featureLevel >= 2 ? count : Math.ceil(count / 2);
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={1} />;
}

/* ---------- (c) per-device accent glow + light streak ---------- */

const glowFragment = /* glsl */ `
  uniform vec3 uColor; uniform float uOpacity; uniform float uStreak;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float halo = pow(max(0.0, 1.0 - length(p)), 2.0);
    // streak: a thin horizontal gaussian bar that fades toward its ends
    float bar = exp(-p.y * p.y * 18.0) * (1.0 - p.x * p.x);
    float a = mix(halo, bar, uStreak) * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }`;

/** Accent halo behind a device's screen and a light streak under it (tinted projectAccent(index)). */
export function DeviceGlow({ index, width = 2.4, height = 1.5 }: { index: number; width?: number; height?: number }) {
  const mats = useMemo(() => {
    const color = new Color().setStyle(projectAccent(index), SRGBColorSpace);
    const make = (streak: number, opacity: number) =>
      new ShaderMaterial({
        uniforms: { uColor: { value: color }, uOpacity: { value: opacity }, uStreak: { value: streak } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: glowFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        toneMapped: false,
      });
    return { halo: make(0, 0.4), streak: make(1, 0.55) };
  }, [index]);
  useEffect(() => () => {
    mats.halo.dispose();
    mats.streak.dispose();
  }, [mats]);
  return (
    <group>
      <mesh position={[0, 0.1, -0.45]} material={mats.halo}>
        <planeGeometry args={[width * 1.8, height * 2.0]} />
      </mesh>
      <mesh position={[0, -1.25, 0.3]} rotation={[-Math.PI / 2, 0, 0]} material={mats.streak}>
        <planeGeometry args={[width * 1.5, 0.9]} />
      </mesh>
    </group>
  );
}

/** Depth for the project void: blurred type wall, bokeh. Mounted from Devices. */
export function VoidDressing({ bokeh }: { bokeh: number }) {
  return (
    <group>
      <TextCylinder />
      {bokeh > 0 && <Bokeh count={bokeh} />}
    </group>
  );
}
