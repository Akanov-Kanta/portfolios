"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, type Mesh, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, Quaternion, ShaderMaterial, SRGBColorSpace, Vector3 } from "three";
import { frame, worldStore } from "../state/world-store";
import { fx, PALETTE } from "../theme";
import { getNoiseTexture } from "./noise-texture";
import { BEAM_DIR } from "./SmokeRibbons";

/** window opening in the back wall (wallWindow at x -2..0, z = -2); shafts start just inside it */
export const WINDOW = new Vector3(-1.0, 1.55, -1.9);
export const SHAFT_LEN = 2.9;
/** radius of the beam (Dust brightens inside it) */
export const BEAM_R = 0.45;

const SHAFTS = [
  { off: new Vector3(0, 0, 0), top: 0.16, bottom: 0.55, len: SHAFT_LEN, a: 1 },
  { off: new Vector3(-0.32, 0.12, 0), top: 0.1, bottom: 0.38, len: SHAFT_LEN * 0.9, a: 0.7 },
  { off: new Vector3(0.34, -0.1, 0), top: 0.08, bottom: 0.32, len: SHAFT_LEN * 0.85, a: 0.6 },
];

/**
 * Moonlight through the window as 1-3 open cones (fake volumetrics, igloo's "fake the light"):
 * alpha = (1 - axial)^2 · view-fresnel soft edge · slow 3D-ish noise, tinted moon blue and nudged
 * toward the station accent. Additive, no depth write. Noise freezes in static mode.
 */
export function LightShafts({ count }: { count: number }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uNoise: { value: getNoiseTexture() }, uTime: { value: 0 }, uColor: { value: new Color() }, uOpacity: { value: 0.16 } },
        vertexShader: /* glsl */ `
          attribute float aAxial; attribute float aAlpha;
          varying float vAxial; varying float vAlpha; varying vec3 vN; varying vec3 vV; varying vec3 vW;
          void main() {
            vAxial = aAxial; vAlpha = aAlpha;
            vec4 w = modelMatrix * vec4(position, 1.0);
            vW = w.xyz;
            vec4 mv = viewMatrix * w;
            vN = normalize(normalMatrix * normal);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D uNoise; uniform float uTime; uniform vec3 uColor; uniform float uOpacity;
          varying float vAxial; varying float vAlpha; varying vec3 vN; varying vec3 vV; varying vec3 vW;
          void main() {
            float axial = clamp(vAxial, 0.0, 1.0);
            float fall = (1.0 - axial) * (1.0 - axial);
            // soft silhouette: faces seen edge-on fade out
            float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
            // two offset planar lookups ≈ slow 3D noise drifting through the beam
            float n = texture2D(uNoise, vW.xz * 0.35 + vec2(uTime * 0.012, uTime * 0.02)).r;
            n *= texture2D(uNoise, vW.yx * 0.5 - vec2(uTime * 0.017, 0.0)).b;
            float a = fall * edge * (0.45 + 1.1 * n) * smoothstep(0.0, 0.08, axial) * uOpacity * vAlpha;
            gl_FragColor = vec4(uColor, a);
          }`,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  const cones = useMemo(
    () =>
      SHAFTS.slice(0, count).map((s) => {
        // open frustum, narrow end (+y) at the window; axial 0 there, 1 at the far end
        const geo = new CylinderGeometry(s.top, s.bottom, s.len, 24, 1, true);
        const pos = geo.getAttribute("position");
        const axial = new Float32Array(pos.count);
        for (let i = 0; i < pos.count; i++) axial[i] = 0.5 - pos.getY(i) / s.len;
        geo.setAttribute("aAxial", new Float32BufferAttribute(axial, 1));
        geo.setAttribute("aAlpha", new Float32BufferAttribute(new Float32Array(pos.count).fill(s.a), 1));
        // frustum axis +y → -BEAM_DIR (apex at the window), centred half a length down the beam
        const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), BEAM_DIR.clone().negate());
        const centre = WINDOW.clone().add(s.off).addScaledVector(BEAM_DIR, s.len / 2);
        return { geo, q, centre };
      }),
    [count],
  );
  useEffect(() => () => cones.forEach((c) => c.geo.dispose()), [cones]);
  const moon = useMemo(() => new Color().setStyle(PALETTE.moon, SRGBColorSpace), []);
  const tint = useMemo(() => new Color(), []);
  const meshes = useRef<(Mesh | null)[]>([]);
  useFrame((_, dt) => {
    // feature level 0 keeps only the main shaft
    meshes.current.forEach((m, i) => m && (m.visible = i === 0 || fx.featureLevel > 0));
    const u = material.uniforms;
    if (worldStore.getState().loopMode !== "static" && !frame.freeze) u.uTime!.value += dt;
    const m = fx.mood.accent;
    tint.setRGB(m[0], m[1], m[2], SRGBColorSpace);
    (u.uColor!.value as Color).copy(moon).lerp(tint, 0.15);
  });
  return (
    <group>
      {cones.map((c, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          geometry={c.geo}
          position={c.centre}
          quaternion={c.q}
          renderOrder={3}
          material={material}
        />
      ))}
    </group>
  );
}
