"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, CanvasTexture, Float32BufferAttribute, MeshBasicMaterial, MultiplyBlending, PlaneGeometry, type Group, type Mesh } from "three";
import { ROOM, ROOM_INTRO_DELAYS, SERVER } from "./layout";
import { smootherstep as smoother } from "../math";
import { frame, useWorld, worldStore } from "../state/world-store";
import { cull } from "./station-window";

/** Floor footprints (piece-local x/z bounds from kit.glb, metres) of the pieces that get a contact shadow. */
const FOOT: Record<string, { x: [number, number]; z: [number, number]; o: number }> = {
  deskCorner: { x: [0, 1.95], z: [-1.95, 0], o: 0.45 },
  chairDesk: { x: [0, 0.67], z: [-0.63, 0], o: 0.6 },
  pottedPlant: { x: [-0.21, 0.21], z: [-0.24, 0.24], o: 0.7 },
  bookcaseOpen: { x: [0, 0.8], z: [-0.5, 0], o: 0.55 },
  cardboardBoxClosed: { x: [0, 0.42], z: [-0.42, 0], o: 0.6 },
  sideTable: { x: [-0.02, 1.05], z: [-0.42, 0.02], o: 0.5 },
  lampSquareFloor: { x: [0, 0.24], z: [-0.24, 0], o: 0.6 },
  trashcan: { x: [-0.21, 0.21], z: [-0.22, 0.24], o: 0.6 },
};
/** shadow blob overhang beyond the footprint */
const SPREAD = 1.35;

/** Radial falloff drawn once to a small canvas (white centre = full shadow, via alphaMap). */
function makeBlob(): CanvasTexture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "#fff");
  g.addColorStop(0.35, "#bbb");
  g.addColorStop(0.7, "#3a3a3a");
  g.addColorStop(1, "#000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(c);
}

interface Blob { x: number; y: number; z: number; ry: number; w: number; d: number; o: number; room: number }

function computeBlobs(): Blob[] {
  const out: Blob[] = [];
  ROOM.forEach((p, i) => {
    const f = FOOT[p.piece];
    if (!f) return;
    const ry = p.rotation?.[1] ?? 0;
    const s = p.scale ?? 1;
    const cx = ((f.x[0] + f.x[1]) / 2) * s, cz = ((f.z[0] + f.z[1]) / 2) * s;
    // rotate the footprint centre by the piece's yaw (three's Y rotation)
    const x = p.position[0] + cx * Math.cos(ry) + cz * Math.sin(ry);
    const z = p.position[2] - cx * Math.sin(ry) + cz * Math.cos(ry);
    out.push({ x, y: 0.024, z, ry, w: (f.x[1] - f.x[0]) * s * SPREAD, d: (f.z[1] - f.z[0]) * s * SPREAD, o: f.o, room: i });
  });
  // server room: plinth on the floor disc, orb logo on the plinth top
  out.push({ x: SERVER.x, y: SERVER.y + 0.012, z: SERVER.z, ry: 0, w: 3.6, d: 3.6, o: 0.7, room: -1 });
  out.push({ x: SERVER.x, y: SERVER.y + 0.302, z: SERVER.z, ry: 0, w: 1.9, d: 1.9, o: 0.55, room: -1 });
  return out;
}

const blobMaterial = (tex: CanvasTexture, opacity: number, vertexColors = false) =>
  new MeshBasicMaterial({
    color: 0x000000, alphaMap: tex, transparent: true, opacity, depthWrite: false, fog: false, toneMapped: false, vertexColors,
    blending: MultiplyBlending, premultipliedAlpha: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });

/**
 * Soft contact shadows for every tier (igloo: a glowing object over a dark floor, grounded by a
 * soft shadow). Multiply-blended black blobs, no depth write, polygon-offset over the floor. Room
 * blobs grow in with their piece during the intro assembly (same per-piece delay as Room.tsx).
 * Phones (no intro) draw the room's blobs and the server room's as one merged mesh each.
 */
export function ContactShadows() {
  const phone = useWorld((s) => s.profile === "phone");
  return phone ? <MergedShadows /> : <BlobShadows />;
}

/**
 * Phones: each group's blobs baked into one geometry (per-vertex alpha = the blob's opacity, which
 * three multiplies into the alphaMap exactly like the per-blob material opacity), so the hero pays
 * one draw for its shadows instead of eight. Multiply blending is order-independent, so merging
 * never changes the result. Culled with the room / server windows (station-window.ts).
 */
function MergedShadows() {
  const tex = useMemo(() => makeBlob(), []);
  const { room, server, mat } = useMemo(() => {
    const blobs = computeBlobs();
    return { room: mergeBlobs(blobs.filter((b) => b.room >= 0)), server: mergeBlobs(blobs.filter((b) => b.room < 0)), mat: blobMaterial(tex, 1, true) };
  }, [tex]);
  useEffect(() => () => {
    tex.dispose();
    room.dispose();
    server.dispose();
    mat.dispose();
  }, [tex, room, server, mat]);
  const refs = useRef<(Mesh | null)[]>([]);
  useFrame(() => {
    const [r, s] = refs.current;
    if (r && r.visible !== cull.room) r.visible = cull.room;
    if (s && s.visible !== cull.server) s.visible = cull.server;
  });
  return (
    <group>
      {[room, server].map((g, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          geometry={g}
          material={mat}
          renderOrder={1}
        />
      ))}
    </group>
  );
}

/** blobs → one indexed geometry: each a unit floor quad scaled, yawed and placed, alpha in a vec4 colour */
function mergeBlobs(blobs: Blob[]): BufferGeometry {
  const pos: number[] = [], uv: number[] = [], col: number[] = [], idx: number[] = [];
  for (const b of blobs) {
    const q = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2).scale(b.w, 1, b.d).rotateY(b.ry).translate(b.x, b.y, b.z);
    const base = pos.length / 3;
    pos.push(...(q.getAttribute("position").array as Float32Array));
    uv.push(...(q.getAttribute("uv").array as Float32Array));
    for (let k = 0; k < q.getAttribute("position").count; k++) col.push(0, 0, 0, b.o);
    for (const i of q.index!.array) idx.push(base + i);
    q.dispose();
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new Float32BufferAttribute(col, 4));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/** Desktop and tablets: one quad per blob, so each can grow in with its piece during the intro. */
function BlobShadows() {
  const tex = useMemo(() => makeBlob(), []);
  const geo = useMemo(() => new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);
  const blobs = useMemo<Blob[]>(() => computeBlobs(), []);
  // one material per blob (same program): opacity is the only difference
  const mats = useMemo(() => blobs.map((b) => blobMaterial(tex, b.o)), [blobs, tex]);
  useEffect(() => () => {
    tex.dispose();
    geo.dispose();
    mats.forEach((m) => m.dispose());
  }, [tex, geo, mats]);

  // intro: the same per-piece delays as Room's assembly
  const delays = ROOM_INTRO_DELAYS;
  const refs = useRef<(Group | null)[]>([]);
  useFrame(() => {
    const playing = worldStore.getState().intro === "playing";
    if (!playing && frame.introT >= 1) {
      if (refs.current[0]?.scale.x !== 1) refs.current.forEach((g) => g?.scale.setScalar(1));
      return;
    }
    blobs.forEach((b, i) => {
      const g = refs.current[i];
      if (!g || b.room < 0) return;
      const k = smoother((frame.introT - 0.1 - delays[b.room]! * 0.55) / 0.35);
      g.scale.setScalar(0.001 + k);
    });
  });

  return (
    <group>
      {blobs.map((b, i) => (
        <group
          key={i}
          ref={(g) => {
            refs.current[i] = g;
          }}
          position={[b.x, b.y, b.z]}
          rotation={[0, b.ry, 0]}
        >
          <mesh geometry={geo} material={mats[i]} scale={[b.w, 1, b.d]} renderOrder={1} />
        </group>
      ))}
    </group>
  );
}
