"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, Euler, Matrix4, PointsMaterial, Quaternion,
  type Group, type Material, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial, type Object3D, type PointLight, type Points,
} from "three";
import { useKit, Piece } from "./Kit";
import { ROOM, ROOM_INTRO_DELAYS, type Placement } from "./layout";
import { createScreenTexture } from "./ScreenTexture";
import { frame, useWorld } from "../state/world-store";
import { rng } from "./rng";
import { smootherstep as smoother, smoothstep } from "../math";
import { worldStore } from "../state/world-store";
import { useLabels } from "../hud/labels-registry";
import { Vector3 } from "three";
import { PALETTE, fx } from "../theme";
import { LightShafts, WINDOW, SHAFT_LEN, BEAM_R } from "./LightShafts";
import { BEAM_DIR } from "./SmokeRibbons";
import { cull, setCulled } from "./station-window";

/** phones: the code screens redraw (and re-upload) at 4 Hz instead of ~8 */
const PHONE_SCREEN_S = 0.25;
/** the lamps' resting intensities (the develop flicker scales them) */
const LAMP_I = 5;
const FLOOR_LAMP_I = 3;
/** the monitor glow's resting intensity (it wakes with the screens) */
const GLOW_I = 2.2;
/** kit.glb's lamp-shade emissive (Kit.tsx) */
const SHADE_EMISSIVE = 0.8;

/**
 * Phone develop (fx.develop 0 → 1, identity at 1): the lamp catches, dips to 0.25 around d ≈ 0.25
 * and again around d ≈ 0.40, then holds. EASE.intro runs fastest through that range (≈ 390 and
 * 430 ms into the 1.2 s), so the dips are wide enough in d to span a frame or two at 60 fps.
 */
export function lampFlicker(d: number): number {
  if (d >= 1) return 1;
  const dip = (c: number, w: number) => 1 - 0.75 * Math.exp(-(((d - c) / w) ** 2));
  return smoothstep(0, 0.12, d) * dip(0.25, 0.04) * dip(0.4, 0.045);
}

/** Emissive panel laid over a Kenney computerScreen (piece-local coordinates, piece scaled ×2). */
function MonitorScreen({ title, seed, phone }: { title: string; seed: number; phone: boolean }) {
  const tex = useMemo(() => createScreenTexture(title, 512, 320, seed), [title, seed]);
  useEffect(() => () => tex.dispose(), [tex]);
  const mat = useRef<MeshBasicMaterial>(null);
  const acc = useRef(0);
  useFrame((_, dt) => {
    // develop: the screens wake from 20 % to full brightness (fx.develop ≡ 1 on desktop: untouched)
    const m = mat.current;
    const b = 0.2 + 0.8 * fx.develop;
    if (m && m.color.r !== b) m.color.setScalar(b);
    // phones: no canvas redraw / upload outside the room window, and 4 Hz inside it
    if (frame.freeze || !cull.room) return;
    if (!phone) {
      tex.tick(dt);
      return;
    }
    acc.current += dt;
    if (acc.current < PHONE_SCREEN_S) return;
    tex.tick(acc.current);
    acc.current = 0;
  });
  return (
    <mesh position={[0.39, 0.34, -0.052]}>
      <planeGeometry args={[0.66, 0.4]} />
      <meshBasicMaterial ref={mat} map={tex.texture} toneMapped={false} />
    </mesh>
  );
}

/**
 * Dust material: a PointsMaterial whose motes brighten up to 3x inside the moonbeam axis
 * (uBeam*: origin at the window, direction, radius, length), so the shafts read as lit air.
 */
function makeDustMaterial(): PointsMaterial {
  const m = new PointsMaterial({ size: 0.012, color: "#ffd9a8", transparent: true, opacity: 0.3, depthWrite: false, blending: AdditiveBlending, sizeAttenuation: true });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uBeamO = { value: WINDOW };
    shader.uniforms.uBeamD = { value: BEAM_DIR };
    shader.uniforms.uBeamR = { value: BEAM_R };
    shader.uniforms.uBeamL = { value: SHAFT_LEN };
    shader.vertexShader =
      "uniform vec3 uBeamO; uniform vec3 uBeamD; uniform float uBeamR; uniform float uBeamL; varying float vBeam;\n" +
      shader.vertexShader.replace(
        "#include <project_vertex>",
        `#include <project_vertex>
        vec3 bw = (modelMatrix * vec4(transformed, 1.0)).xyz - uBeamO;
        float bt = clamp(dot(bw, uBeamD), 0.0, uBeamL);
        // the beam widens with the cone and fades along it
        float br = uBeamR * (0.4 + 0.6 * bt / uBeamL);
        vBeam = 1.0 + 2.0 * smoothstep(br, 0.0, length(bw - uBeamD * bt)) * (1.0 - 0.5 * bt / uBeamL);`,
      );
    shader.fragmentShader =
      "varying float vBeam;\n" + shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n  diffuseColor.rgb *= vBeam;");
  };
  m.customProgramCacheKey = () => "dust-beam";
  return m;
}

/** Warm dust motes drifting in the lamp light above the desk (brighter where they cross the moonbeam). */
function Dust({ count }: { count: number }) {
  const ref = useRef<Points>(null!);
  const material = useMemo(() => makeDustMaterial(), []);
  useEffect(() => () => material.dispose(), [material]);
  const { positions, seeds } = useMemo(() => {
    const p = new Float32Array(count * 3), s = new Float32Array(count);
    const r = rng(42);
    for (let i = 0; i < count; i++) {
      p[i * 3] = -2 + r() * 3.6;
      p[i * 3 + 1] = 0.3 + r() * 2.2;
      p[i * 3 + 2] = -2 + r() * 3.6;
      s[i] = r() * Math.PI * 2;
    }
    return { positions: p, seeds: s };
  }, [count]);
  useFrame((state) => {
    const pts = ref.current;
    // phones: no buffer rewrite + upload outside the room window
    if (!pts || frame.freeze || !cull.room) return;
    const t = state.clock.elapsedTime;
    const posAttr = pts.geometry.getAttribute("position") as import("three").BufferAttribute;
    const arr = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += Math.sin(t * 0.3 + seeds[i]) * 0.0006;
      arr[i * 3 + 1] += 0.0004 + Math.cos(t * 0.2 + seeds[i]) * 0.0003;
      if (arr[i * 3 + 1] > 2.3) arr[i * 3 + 1] = 0.6;
    }
    posAttr.needsUpdate = true;
  });
  return (
    <points ref={ref} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
    </points>
  );
}

const MERGE_ATTRS = ["position", "normal", "uv", "color"] as const;
/** the attribute layout a geometry is merged by (only same-layout geometries of one material merge) */
const layoutOf = (g: BufferGeometry) => MERGE_ATTRS.map((n) => g.getAttribute(n)?.itemSize ?? 0).join(",");

/** Concatenate same-layout geometries (already in world space) into one indexed geometry. */
function mergeGeometries(geos: BufferGeometry[]): BufferGeometry {
  const names = MERGE_ATTRS.filter((n) => geos[0]!.getAttribute(n));
  const total = geos.reduce((s, g) => s + g.getAttribute("position").count, 0);
  const out = new BufferGeometry();
  for (const n of names) {
    const size = geos[0]!.getAttribute(n).itemSize;
    const arr = new Float32Array(total * size);
    let o = 0;
    for (const g of geos) {
      const a = g.getAttribute(n);
      for (let i = 0; i < a.count; i++) for (let c = 0; c < size; c++) arr[o++] = a.getComponent(i, c);
    }
    out.setAttribute(n, new BufferAttribute(arr, size));
  }
  const idx: number[] = [];
  let base = 0;
  for (const g of geos) {
    const n = g.getAttribute("position").count;
    if (g.index) for (let i = 0; i < g.index.count; i++) idx.push(base + g.index.getX(i));
    else for (let i = 0; i < n; i++) idx.push(base + i);
    base += n;
  }
  out.setIndex(idx);
  out.computeBoundingSphere();
  return out;
}

/**
 * Phones (no intro assembly, so the kit never moves): every kit piece baked into world space and
 * merged into ONE mesh per material, instead of one draw per piece mesh (hero kit: 50 draws → 14).
 * Same material objects (Kit.tsx's tweaks, the develop's lamp-shade emissive), so no new programs.
 */
function MergedKit({ byName }: { byName: Map<string, Object3D> }) {
  const merged = useMemo(() => {
    const byMat = new Map<string, { mat: Material; geos: BufferGeometry[] }>();
    const loose: { geo: BufferGeometry; mat: Material | Material[] }[] = [];
    const piece = new Matrix4(), toObj = new Matrix4(), world = new Matrix4();
    const pos = new Vector3(), quat = new Quaternion(), scl = new Vector3();
    for (const p of ROOM) {
      const obj = byName.get(p.piece);
      if (!obj) continue;
      const r = p.rotation ?? [0, 0, 0];
      piece.compose(pos.set(...p.position), quat.setFromEuler(new Euler(r[0], r[1], r[2])), scl.setScalar(p.scale ?? 1));
      obj.updateWorldMatrix(true, true);
      // the clone Piece renders keeps obj's own transform: world = piece · (obj and below, relative to its glTF parent)
      toObj.copy(obj.parent?.matrixWorld ?? world.identity()).invert();
      obj.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh || !m.visible) return;
        world.multiplyMatrices(toObj, m.matrixWorld).premultiply(piece);
        const geo = m.geometry.clone().applyMatrix4(world);
        if (Array.isArray(m.material) || geo.groups.length > 0) loose.push({ geo, mat: m.material });
        else {
          const key = `${m.material.uuid}|${layoutOf(geo)}`;
          const e = byMat.get(key) ?? { mat: m.material, geos: [] };
          e.geos.push(geo);
          byMat.set(key, e);
        }
      });
    }
    const meshes = [...byMat.values()].map(({ mat, geos }) => {
      const geo = mergeGeometries(geos);
      geos.forEach((g) => g.dispose());
      return { geo, mat: mat as Material | Material[] };
    });
    return [...meshes, ...loose];
  }, [byName]);
  useEffect(() => () => merged.forEach((m) => m.geo.dispose()), [merged]);
  return (
    <>
      {merged.map((m, i) => (
        <mesh key={i} geometry={m.geo} material={m.mat} />
      ))}
    </>
  );
}

/**
 * The night room. Phones: the static kit is drawn merged (MergedKit; the tagged pieces keep a
 * placed group for their screens and lamp lights), everything but the lights is culled outside the
 * room window (setCulled only hides light-free subtrees), and the develop (fx.develop) flickers the
 * lamps on and wakes the screens. At d = 1 the develop is identity, so desktop is untouched.
 */
export function Room({ dust, shafts }: { dust: number; shafts: number }) {
  const { byName } = useKit();
  const group = useRef<Group>(null);
  const lampColor = useMemo(() => new Color(PALETTE.lamp), []);
  const screenColor = useMemo(() => new Color(PALETTE.screen), []);
  const phone = useWorld((s) => s.profile === "phone");

  // develop: [table lamp, floor lamp, monitor glow] and the (shared) lamp-shade material
  const lights = useRef<(PointLight | null)[]>([]);
  const shades = useMemo(() => {
    const out = new Set<MeshStandardMaterial>();
    for (const name of ["lampRoundTable", "lampSquareFloor"])
      byName.get(name)?.traverse((o) => {
        const m = (o as Mesh).material as MeshStandardMaterial | MeshStandardMaterial[] | undefined;
        for (const mat of Array.isArray(m) ? m : m ? [m] : []) if (mat.name === "lamp") out.add(mat);
      });
    return [...out];
  }, [byName]);
  const dev = useRef({ d: 1, shown: true });
  useFrame(() => {
    const s = dev.current;
    if (cull.room !== s.shown) {
      s.shown = cull.room;
      setCulled(group.current, cull.room);
    }
    const d = fx.develop;
    if (d === s.d) return;
    s.d = d;
    const k = lampFlicker(d);
    const [lamp, floor, glow] = lights.current;
    if (lamp) lamp.intensity = LAMP_I * k;
    if (floor) floor.intensity = FLOOR_LAMP_I * k;
    if (glow) glow.intensity = GLOW_I * (0.2 + 0.8 * d);
    for (const m of shades) m.emissiveIntensity = SHADE_EMISSIVE * k;
  });

  // intro assembly: every piece drops in from above with its own delay
  const pieceRefs = useRef<(Group | null)[]>([]);
  const delays = ROOM_INTRO_DELAYS;
  useFrame(() => {
    const playing = worldStore.getState().intro === "playing";
    if (!playing && frame.introT >= 1) return;
    pieceRefs.current.forEach((g, i) => {
      if (!g) return;
      const k = smoother((frame.introT - 0.1 - delays[i] * 0.55) / 0.35);
      g.position.y = (1 - k) * 1.8;
      const sc = 0.001 + k;
      g.scale.setScalar(sc);
      g.visible = k > 0.001;
    });
  });

  useLabels(
    useMemo(
      () => [
        { id: "mon", station: ["hero"], world: new Vector3(-1.1, 1.4, -1.55), side: "left" as const, lines: () => ["MON_01 // 3440×1440", `LOAD ${(38 + Math.random() * 9).toFixed(1)}%`] },
        { id: "lamp", station: ["hero", "about"], world: new Vector3(-0.3, 1.45, -1.9), side: "right" as const, lines: () => ["LAMP // 2700K", `${(21.5 + Math.random() * 0.4).toFixed(2)}°C`] },
        { id: "plant", station: ["hero"], world: new Vector3(1.75, 1.1, 0.9), side: "right" as const, lines: () => ["FICUS_01", `SOIL ${(58 + Math.random() * 3).toFixed(0)}%`] },
      ],
      [],
    ),
  );

  const extras = (p: Placement) => (
    <>
      {p.tag === "monitorL" && <MonitorScreen title="world/CameraRig.tsx" seed={3} phone={phone} />}
      {p.tag === "monitorR" && <MonitorScreen title="scroll/anchors.ts" seed={11} phone={phone} />}
      {p.tag === "lamp" && (
        <pointLight
          ref={(l) => {
            lights.current[0] = l;
          }}
          position={[0.16, 0.55, -0.16]}
          color={lampColor}
          intensity={LAMP_I}
          distance={6}
          decay={2}
        />
      )}
      {p.tag === "floorLamp" && (
        <pointLight
          ref={(l) => {
            lights.current[1] = l;
          }}
          position={[0.2, 1.6, -0.2]}
          color="#ffc98a"
          intensity={FLOOR_LAMP_I}
          distance={6}
          decay={2}
        />
      )}
    </>
  );
  const render = (p: Placement, i: number) =>
    phone ? (
      // phones: the kit itself is in <MergedKit>; only the tagged pieces keep a placed group for their extras
      p.tag && byName.has(p.piece) ? (
        <group key={i} position={p.position} rotation={p.rotation ?? [0, 0, 0]} scale={p.scale ?? 1}>
          {extras(p)}
        </group>
      ) : null
    ) : (
      <Piece
        key={i}
        p={p}
        byName={byName}
        groupRef={(g) => {
          pieceRefs.current[i] = g;
        }}
      >
        {extras(p)}
      </Piece>
    );

  return (
    <group ref={group}>
      {/* floor slab */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 4.2]} />
        <meshStandardMaterial color="#1a1720" roughness={0.95} />
      </mesh>
      {phone && <MergedKit byName={byName} />}
      {ROOM.map(render)}
      {/* monitor glow */}
      <pointLight
        ref={(l) => {
          lights.current[2] = l;
        }}
        position={[-1.05, 1.15, -1.1]}
        color={screenColor}
        intensity={GLOW_I}
        distance={3.5}
        decay={2}
      />
      {/* moonlight through the window (direction = BEAM_DIR, which the shafts and haze follow) */}
      <directionalLight position={[-1.5, 5, -6]} target-position={[-1, 0, 0]} color={PALETTE.moon} intensity={0.5} />
      {/* cool rim from the window side: separates furniture edges from the dark (rendered-still pass) */}
      <directionalLight position={[-4, 3.2, -5]} target-position={[0.4, 0.8, 0.6]} color={PALETTE.moon} intensity={0.8} />
      {shafts > 0 && <LightShafts count={shafts} />}
      <Dust count={dust} />
    </group>
  );
}
