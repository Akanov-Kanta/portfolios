"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferGeometry, Color, Float32BufferAttribute, ShaderMaterial, SRGBColorSpace, Vector2, type AmbientLight, type Fog, type HemisphereLight } from "three";
import { frame, worldStore } from "../state/world-store";
import { fx, moodAt, MOODS, type RGB } from "../theme";
import { fogShared } from "./fog-chunks";
import { SERVER, STACK_BOTTOM } from "./layout";

/** floor the height mist hugs, per MOODS key (hero, about, projects, portal, contact, ascent) */
const MIST_Y0 = [0, 0, STACK_BOTTOM - 2, SERVER.y, SERVER.y, SERVER.y];

/** same keys + smoothstep as theme.moodAt, for the one value that is scene-specific */
function mistFloorAt(t: number): number {
  const p = ((t % 1) + 1) % 1;
  let i = 0;
  for (let k = 0; k < MOODS.length; k++) if (MOODS[k]!.t <= p) i = k;
  const j = (i + 1) % MOODS.length;
  const t0 = MOODS[i]!.t, t1 = j === 0 ? 1 : MOODS[j]!.t;
  const x = Math.min(1, Math.max(0, (p - t0) / Math.max(1e-6, t1 - t0)));
  const s = x * x * (3 - 2 * x);
  return MIST_Y0[i]! + (MIST_Y0[j]! - MIST_Y0[i]!) * s;
}

const set = (c: Color, rgb: RGB) => c.setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace);

const AMBIENT = new Color("#404a80"), HEMI_SKY = new Color("#3a4a8a"), HEMI_GROUND = new Color("#1a1410");

/**
 * Screen-space diagonal backdrop (fog → fogHigh toward the top-right), drawn first at the far plane
 * so the sky matches the diagonal fog colour exactly (a flat clear colour would halo far silhouettes).
 */
function makeBackdrop() {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const material = new ShaderMaterial({
    uniforms: { uLow: { value: new Color() }, uHigh: { value: new Color() }, uRes: { value: new Vector2(1, 1) } },
    depthWrite: false,
    toneMapped: false,
    vertexShader: /* glsl */ `void main() { gl_Position = vec4(position.xy, 1.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uLow; uniform vec3 uHigh; uniform vec2 uRes;
      void main() {
        vec2 s = gl_FragCoord.xy / max(uRes, vec2(1.0));
        float d = clamp((s.x + s.y) * 0.5, 0.0, 1.0);
        gl_FragColor = vec4(mix(uLow, uHigh, d * d), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  return { geometry, material };
}

/**
 * The world's single colour source. Writes fx.mood = moodAt(frame.t) every rendered frame
 * (priority -40, after CameraRig) and pushes it, in place, into the fog, the backdrop/clear colour,
 * the shared fog-chunk uniforms and the fill lights. No React state, no allocation per frame.
 * Static mode still gets the right station colour: this runs on every dirty render.
 */
export function Atmosphere({ fogNoise }: { fogNoise: boolean }) {
  const gl = useThree((s) => s.gl);
  const fog = useRef<Fog>(null);
  const bg = useRef<Color>(null);
  const ambient = useRef<AmbientLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const backdrop = useMemo(() => makeBackdrop(), []);
  useEffect(() => () => {
    backdrop.geometry.dispose();
    backdrop.material.dispose();
  }, [backdrop]);
  const s = useMemo(() => ({ c: new Color(), res: new Vector2(), time: 0 }), []);

  const apply = (dt: number) => {
    const m = moodAt(frame.t, fx.mood);
    const staticMode = worldStore.getState().loopMode === "static";
    if (!staticMode && !frame.freeze) s.time += dt;
    if (fog.current) {
      set(fog.current.color, m.fog);
      fog.current.near = m.fogNear;
      fog.current.far = m.fogFar;
    }
    if (bg.current) {
      set(bg.current, m.fog);
      gl.setClearColor(bg.current);
    }
    const u = backdrop.material.uniforms;
    set(u.uLow!.value as Color, m.fog);
    set(u.uHigh!.value as Color, m.fogHigh);
    set(s.c, m.fogHigh);
    fogShared.high.x = s.c.r;
    fogShared.high.y = s.c.g;
    fogShared.high.z = s.c.b;
    fogShared.params.x = m.mist;
    fogShared.params.y = s.time;
    fogShared.params.z = mistFloorAt(frame.t);
    fogShared.params.w = fogNoise && fx.featureLevel > 0 ? 1 : 0;
    gl.getDrawingBufferSize(s.res);
    fogShared.res.x = s.res.x;
    fogShared.res.y = s.res.y;
    (u.uRes!.value as Vector2).copy(s.res);
    // fill lights lean a little toward the station: accent in the sky, lift in the bounce
    set(s.c, m.accent);
    ambient.current?.color.copy(AMBIENT).lerp(s.c, 0.22);
    hemi.current?.color.copy(HEMI_SKY).lerp(s.c, 0.18);
    set(s.c, m.lift);
    hemi.current?.groundColor.copy(HEMI_GROUND).lerp(s.c, 0.5);
  };

  // correct before Warmup's first compile/render, not one frame late
  useEffect(() => apply(0));
  useFrame((_, dt) => apply(dt), -40);

  return (
    <>
      <color ref={bg} attach="background" args={["#0a0b10"]} />
      <fog ref={fog} attach="fog" args={["#0a0b10", 9, 48]} />
      <ambientLight ref={ambient} color="#404a80" intensity={0.5} />
      <hemisphereLight ref={hemi} color="#3a4a8a" groundColor="#1a1410" intensity={0.6} />
      <mesh geometry={backdrop.geometry} material={backdrop.material} frustumCulled={false} renderOrder={-1e6} />
    </>
  );
}
