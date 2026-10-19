"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, DoubleSide, Float32BufferAttribute, Matrix4, PlaneGeometry, Quaternion, ShaderMaterial, SRGBColorSpace, Vector3, type BufferGeometry, type Mesh } from "three";
import { frame, worldStore } from "../state/world-store";
import { fx, PALETTE } from "../theme";
import { getNoiseTexture } from "./noise-texture";
import { PORTAL } from "./Portal";
import { SERVER } from "./layout";
import { rng } from "./rng";

/**
 * igloo's smoke: curved strips whose alpha is a product of three scrolling noise lookups raised to
 * the 3rd power, so only the rare overlaps of bright noise survive as wisps. One ShaderMaterial for
 * every ribbon (per-ribbon colour and seed are vertex attributes), additive, no depth write.
 * Placements: window haze in the room, a ring of smoke at the tunnel mouth, floor mist round the plinth.
 */
const vertexShader = /* glsl */ `
  attribute vec3 aColor; attribute float aSeed; attribute float aAspect;
  varying vec2 vUv; varying vec3 vColor; varying float vSeed; varying float vAspect; varying float vNear;
  void main() {
    vUv = uv; vColor = aColor; vSeed = aSeed; vAspect = aAspect;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // fade out when the camera flies through a ribbon
    vNear = smoothstep(0.4, 1.8, -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const fragmentShader = /* glsl */ `
  uniform sampler2D uNoise; uniform float uTime; uniform vec3 uTint; uniform float uOpacity;
  varying vec2 vUv; varying vec3 vColor; varying float vSeed; varying float vAspect; varying float vNear;
  void main() {
    vec2 p = vec2(vUv.x * vAspect, vUv.y) + vSeed * 7.31;
    float n1 = texture2D(uNoise, p * 0.3 * 3.0 / 4.0 + vec2(uTime * 0.05, 0.0)).r;
    float n2 = texture2D(uNoise, p * 0.3 + vec2(-uTime * 0.09, uTime * 0.02)).r;
    float n3 = texture2D(uNoise, p * 0.3 * 6.0 / 4.0 + vec2(uTime * 0.15, -uTime * 0.03)).r;
    float a = pow(n1 * n2 * n3 * 2.4, 3.0);
    a *= smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x) * smoothstep(0.0, 0.3, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
    a = min(a, 1.0) * uOpacity * vNear;
    if (a < 0.002) discard;
    gl_FragColor = vec4(mix(vColor, uTint, 0.25), a);
  }`;

interface Spec { w: number; h: number; bend: number; ring?: boolean; pos: Vector3; quat: Quaternion; color: string; seed: number }

/**
 * Plane bent round its local Y axis with radius `bend`. `ring`: the circle is centred on the origin
 * (an arc at radius `bend` round the placement's axis); otherwise the strip's middle stays on the origin.
 */
function ribbonGeometry(s: Spec): BufferGeometry {
  const g = new PlaneGeometry(s.w, s.h, 24, 1);
  const pos = g.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const a = pos.getX(i) / s.bend;
    pos.setXYZ(i, Math.sin(a) * s.bend, pos.getY(i), Math.cos(a) * s.bend - (s.ring ? 0 : s.bend));
  }
  g.computeVertexNormals();
  g.applyMatrix4(new Matrix4().compose(s.pos, s.quat, new Vector3(1, 1, 1)));
  const c = new Color().setStyle(s.color, SRGBColorSpace);
  const n = pos.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  g.setAttribute("aColor", new Float32BufferAttribute(col, 3));
  g.setAttribute("aSeed", new Float32BufferAttribute(new Float32Array(n).fill(s.seed), 1));
  g.setAttribute("aAspect", new Float32BufferAttribute(new Float32Array(n).fill(s.w / s.h), 1));
  g.computeBoundingSphere();
  return g;
}

const X = new Vector3(1, 0, 0), Y = new Vector3(0, 1, 0);
/** moonbeam direction through the window (matches Room's moon light and LightShafts) */
export const BEAM_DIR = new Vector3(0.5, -5, 6).normalize();

/** `count` ribbons per placement (tier). */
function specs(count: number): Spec[][] {
  const r = rng(301);
  const room: Spec[] = [], tunnel: Spec[] = [], plinth: Spec[] = [];
  // window haze sheets contain the beam: local X = world x, local Y = back up the beam
  const up = BEAM_DIR.clone().negate();
  const hazeBasis = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(X, up, new Vector3().crossVectors(X, up)));
  const toTunnel = new Quaternion().setFromUnitVectors(Y, PORTAL.tunnel.tan);
  for (let i = 0; i < count; i++) {
    room.push({
      w: 1.4 + r() * 0.8, h: 1.2 + r() * 0.6, bend: 3,
      pos: new Vector3(-1.3 + r() * 0.9, 1.0 + r() * 0.5, -1.2 + r() * 0.8),
      quat: hazeBasis.clone().multiply(new Quaternion().setFromAxisAngle(Y, (r() - 0.5) * 0.5)),
      color: i % 2 ? PALETTE.moon : PALETTE.ice, seed: r() * 10,
    });
    // tunnel mouth: arcs round the tunnel axis, just outside its radius
    tunnel.push({
      w: 2.6 + r() * 1.2, h: 1.4 + r() * 0.6, bend: PORTAL.tunnel.r + 0.4 + r() * 0.5, ring: true,
      pos: PORTAL.tunnel.mouth.clone().addScaledVector(PORTAL.tunnel.tan, -0.6 + r() * 1.2),
      quat: toTunnel.clone().multiply(new Quaternion().setFromAxisAngle(Y, (i / count) * Math.PI * 2 + r() * 0.6)),
      color: i % 2 ? PALETTE.violet : PALETTE.screen, seed: r() * 10,
    });
    // floor mist: low standing arcs round the plinth
    plinth.push({
      w: 2.4 + r(), h: 0.7 + r() * 0.3, bend: 1.8 + r() * 1.4, ring: true,
      pos: new Vector3(SERVER.x, SERVER.y + 0.3, SERVER.z),
      quat: new Quaternion().setFromAxisAngle(Y, (i / count) * Math.PI * 2 + r()),
      color: i % 2 ? PALETTE.ice : PALETTE.screen, seed: r() * 10,
    });
  }
  return [room, tunnel, plinth];
}

/** `count` ribbons per placement (tier), halved while fx.featureLevel < 2. */
export function SmokeRibbons({ count }: { count: number }) {
  const groups = useMemo(() => specs(count).map((set) => set.map(ribbonGeometry)), [count]);
  useEffect(() => () => groups.flat().forEach((g) => g.dispose()), [groups]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uNoise: { value: getNoiseTexture() }, uTime: { value: 0 }, uTint: { value: new Color() }, uOpacity: { value: 0.32 } },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  const meshes = useRef<(Mesh | null)[][]>([]);
  useFrame((_, dt) => {
    const u = material.uniforms;
    if (worldStore.getState().loopMode !== "static" && !frame.freeze) u.uTime!.value += dt;
    const m = fx.mood.accent;
    (u.uTint!.value as Color).setRGB(m[0], m[1], m[2], SRGBColorSpace);
    const visible = fx.featureLevel >= 2 ? count : Math.ceil(count / 2);
    meshes.current.forEach((row) => row.forEach((mesh, i) => mesh && (mesh.visible = i < visible)));
  });
  return (
    <group>
      {groups.map((row, gi) =>
        row.map((geo, i) => (
          <mesh
            key={`${gi}-${i}`}
            ref={(m) => {
              (meshes.current[gi] ??= [])[i] = m;
            }}
            geometry={geo}
            material={material}
            renderOrder={2}
          />
        )),
      )}
    </group>
  );
}
