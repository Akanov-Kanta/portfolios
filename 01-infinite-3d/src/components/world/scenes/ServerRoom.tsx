"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending, BoxGeometry, Color, InstancedBufferAttribute, InstancedBufferGeometry, InstancedMesh, Matrix4, MeshBasicMaterial,
  PlaneGeometry, ShaderMaterial, SRGBColorSpace, type Group, type Mesh,
} from "three";
import { SERVER } from "./layout";
import { IconCloud } from "./IconCloud";
import { ServerFloor } from "./ServerFloor";
import { reflectable } from "./reflect";
import { isCalm } from "../state/world-store";
import { socialStore } from "../state/social-store";
import { useLabels } from "../hud/labels-registry";
import { Vector3 } from "three";
import { rng } from "./rng";
import { fx, PALETTE } from "../theme";
import { cull, setCulled } from "./station-window";

/** the orb logo's centre in the server room (room-local) and its bounding radius (the phone framing's subject) */
export const ORB_POS: [number, number, number] = [0, 2.2, 0];
export const ORB_RADIUS = 1.4;

const LED_COUNT = 14;
const LED_STEP = 0.11;
const LED_Y0 = 0.3;
const RACK_X = [-2.6, 2.6];
const COL_X = [-0.25, 0.25];
const RACK_Z = -2.2;
/** LED seeds, shared by the LED meshes and their floor glow so both blink in phase */
const SEEDS = (() => {
  const r = rng(9);
  return Array.from({ length: LED_COUNT }, () => r() * 10);
})();
const rate = (i: number) => 1.5 + (i % 3);
const ledColor = (i: number) => (i % 4 === 0 ? PALETTE.lamp : PALETTE.screen);

/**
 * One blink clock for the whole room: advances with time, and a carousel change (fx.impulse, ±1
 * decaying) spins it forward or back in the direction of travel. Frozen (steady LEDs) in static
 * mode / ?freeze. `steady` tells consumers to show every LED at a constant level.
 */
function useBlinkClock() {
  const clock = useMemo(() => ({ phase: 0, steady: false }), []);
  useFrame((_, dt) => {
    clock.steady = isCalm();
    if (!clock.steady) clock.phase += dt * (1 + fx.impulse * 5);
  }, -1);
  return clock;
}
type BlinkClock = ReturnType<typeof useBlinkClock>;

/** every LED in the room (2 racks × 2 columns × LED_COUNT), rack-local seed index i */
const LED_SLOTS = RACK_X.flatMap((rx) => COL_X.flatMap((cx) => SEEDS.map((_, i) => ({ x: rx + cx, y: LED_Y0 + i * LED_STEP, z: RACK_Z + 0.36, i }))));

/**
 * Every rack LED in ONE instanced draw (was one mesh + material per LED). Unlit, per-instance colour
 * = accent × blink level (>1 feeds bloom, toneMapped off), recomputed each frame from the shared
 * clock into a typed array: no allocation. On the reflection layer, so the floor mirrors it.
 */
function Leds({ clock }: { clock: BlinkClock }) {
  const leds = useMemo(() => {
    const geo = new BoxGeometry(0.04, 0.04, 0.02);
    const mat = new MeshBasicMaterial({ toneMapped: false });
    const mesh = new InstancedMesh(geo, mat, LED_SLOTS.length);
    const base = new Float32Array(LED_SLOTS.length * 3);
    const c = new Color();
    const m = new Matrix4();
    LED_SLOTS.forEach((s, k) => {
      mesh.setMatrixAt(k, m.makeTranslation(s.x, s.y, s.z));
      c.setStyle(ledColor(s.i), SRGBColorSpace);
      base.set([c.r, c.g, c.b], k * 3);
    });
    // instanceColor must exist before the first compile (it is a program define)
    mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(LED_SLOTS.length * 3), 3);
    mesh.computeBoundingSphere();
    reflectable(mesh);
    return { mesh, geo, mat, base };
  }, []);
  useEffect(() => () => {
    leds.geo.dispose();
    leds.mat.dispose();
    leds.mesh.dispose();
  }, [leds]);
  useFrame(() => {
    if (!cull.server) return;
    const out = leds.mesh.instanceColor!;
    const a = out.array as Float32Array, b = leds.base;
    for (let k = 0; k < LED_SLOTS.length; k++) {
      const i = LED_SLOTS[k]!.i;
      // on-level kept below the orb logo's brightness so the racks stay atmosphere
      const level = clock.steady ? 0.9 : Math.sin(clock.phase * rate(i) + SEEDS[i]!) > 0.2 ? 1.8 : 0.15;
      a[k * 3] = b[k * 3]! * level;
      a[k * 3 + 1] = b[k * 3 + 1]! * level;
      a[k * 3 + 2] = b[k * 3 + 2]! * level;
    }
    out.needsUpdate = true;
  });
  return <primitive object={leds.mesh} />;
}

/**
 * Floor glow under the rack LEDs: one instanced additive quad per LED, laid on the floor in front
 * of its rack like a soft reflection (higher LEDs land further out). The blink is recomputed in
 * the shader from the same seed/rate/phase as the LED meshes, so both are always in phase.
 */
function LedFloorGlow({ clock }: { clock: BlinkClock }) {
  const geo = useMemo(() => {
    const g = new InstancedBufferGeometry();
    const quad = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    g.index = quad.index;
    g.setAttribute("position", quad.getAttribute("position"));
    g.setAttribute("uv", quad.getAttribute("uv"));
    const n = RACK_X.length * COL_X.length * LED_COUNT;
    const off = new Float32Array(n * 3), seed = new Float32Array(n), rt = new Float32Array(n), col = new Float32Array(n * 3);
    const c = new Color();
    let k = 0;
    for (const rx of RACK_X)
      for (const cx of COL_X)
        for (let i = 0; i < LED_COUNT; i++, k++) {
          const h = LED_Y0 + i * LED_STEP;
          off.set([rx + cx, 0.008, RACK_Z + 0.36 + 0.15 + h * 0.55], k * 3);
          seed[k] = SEEDS[i]!;
          rt[k] = rate(i);
          c.setStyle(ledColor(i), SRGBColorSpace);
          col.set([c.r, c.g, c.b], k * 3);
        }
    g.setAttribute("aOffset", new InstancedBufferAttribute(off, 3));
    g.setAttribute("aSeed", new InstancedBufferAttribute(seed, 1));
    g.setAttribute("aRate", new InstancedBufferAttribute(rt, 1));
    g.setAttribute("aColor", new InstancedBufferAttribute(col, 3));
    g.instanceCount = n;
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uPhase: { value: 0 }, uSteady: { value: 0 } },
        vertexShader: /* glsl */ `
          attribute vec3 aOffset; attribute float aSeed; attribute float aRate; attribute vec3 aColor;
          uniform float uPhase; uniform float uSteady;
          varying vec2 vUv; varying vec3 vColor; varying float vOn;
          void main() {
            vUv = uv; vColor = aColor;
            float on = step(0.2, sin(uPhase * aRate + aSeed));
            vOn = mix(mix(0.05, 1.0, on), 0.4, uSteady);
            vec3 p = position * vec3(0.7, 1.0, 1.3) + aOffset;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          varying vec2 vUv; varying vec3 vColor; varying float vOn;
          void main() {
            vec2 p = (vUv - 0.5) * 2.0;
            float a = pow(max(0.0, 1.0 - dot(p, p)), 3.0) * 0.07 * vOn;
            if (a < 0.002) discard;
            gl_FragColor = vec4(vColor, a);
          }`,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);
  useFrame(() => {
    if (!cull.server) return;
    mat.uniforms.uPhase!.value = clock.phase;
    mat.uniforms.uSteady!.value = clock.steady ? 1 : 0;
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={1} />;
}

/**
 * Vertical-gradient halo behind the orb logo: separates it from the dark room, additive and
 * bright enough to feed bloom. Breathes with the sound (0.6 + 0.4 · fx.audio), tinted by the mood accent.
 */
function Halo() {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uColor: { value: new Color() }, uLow: { value: new Color().setStyle(PALETTE.violet, SRGBColorSpace) }, uIntensity: { value: 0.6 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform vec3 uLow; uniform float uIntensity; varying vec2 vUv;
          void main() {
            float x = (vUv.x - 0.5) * 2.0;
            float side = pow(max(0.0, 1.0 - x * x), 1.6);
            // brightest just below the logo's centre, long soft fall upward, short fall to the plinth
            float y = vUv.y;
            float v = smoothstep(0.0, 0.35, y) * (1.0 - smoothstep(0.35, 1.0, y));
            vec3 col = mix(uLow, uColor, smoothstep(0.1, 0.6, y));
            gl_FragColor = vec4(col, side * v * 0.32 * uIntensity);
          }`,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  const ref = useRef<Mesh>(null);
  useFrame(({ camera }) => {
    if (!cull.server) return;
    const a = fx.mood.accent;
    (mat.uniforms.uColor!.value as Color).setRGB(a[0], a[1], a[2], SRGBColorSpace);
    mat.uniforms.uIntensity!.value = 0.6 + 0.4 * Math.min(1, Math.max(0, fx.audio));
    // billboard around Y only, so the gradient stays vertical
    const m = ref.current;
    if (m) m.rotation.y = Math.atan2(camera.position.x - SERVER.x, camera.position.z - SERVER.z);
  });
  return (
    <mesh
      ref={(m) => {
        ref.current = m;
        reflectable(m);
      }}
      position={[0, 2.1, -0.9]}
      material={mat}
      renderOrder={0}
    >
      <planeGeometry args={[5.2, 5.6]} />
    </mesh>
  );
}

/**
 * The footer "room": plinth + orb logo, concentric floor rings (igloo's footer motif), racks.
 * Phones cull everything but the two point lights outside the server window (station-window.ts).
 */
export function ServerRoom({ orbs = 14000 }: { orbs?: number }) {
  const { x, y, z } = SERVER;
  const clock = useBlinkClock();
  const root = useRef<Group>(null);
  const shown = useRef(true);
  useFrame(() => {
    if (cull.server === shown.current) return;
    shown.current = cull.server;
    setCulled(root.current, cull.server);
  });
  useLabels(
    useMemo(
      () => [
        { id: "icon", station: ["contact"], world: new Vector3(x + 1.6, y + 3.55, z), side: "right" as const, lines: () => [`LINK // ${socialStore.getState().label.toUpperCase() || "..."}`, `${orbs.toLocaleString("en-US")} ORBS`] },
      ],
      [x, y, z, orbs],
    ),
  );
  return (
    <group ref={root} position={[x, y, z]}>
      {/* floor disc (reflection on high, cursor grid) + rings */}
      <ServerFloor />
      {[2.2, 3.6, 5.2].map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005 + i * 0.001, 0]}>
          <ringGeometry args={[r - 0.02, r + 0.02, 96]} />
          <meshBasicMaterial color={i === 0 ? PALETTE.screen : "#2c3a78"} toneMapped={false} transparent opacity={0.8} />
        </mesh>
      ))}
      {/* plinth */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[1.1, 1.25, 0.3, 48]} />
        <meshStandardMaterial color="#1b1f33" roughness={0.6} metalness={0.2} />
      </mesh>
      <Halo />
      <IconCloud count={orbs} position={ORB_POS} />
      {/* racks behind */}
      {RACK_X.map((rx) => (
        <group key={rx} position={[rx, 0, RACK_Z]}>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.8, 2, 0.7]} />
            <meshStandardMaterial color="#141828" roughness={0.7} metalness={0.3} />
          </mesh>
        </group>
      ))}
      <Leds clock={clock} />
      <LedFloorGlow clock={clock} />
      <pointLight position={[0, 2.5, 1.5]} color={PALETTE.screen} intensity={6} distance={12} decay={2} />
      <pointLight position={[0, 1, -3]} color={PALETTE.violet} intensity={3} distance={10} decay={2} />
    </group>
  );
}
