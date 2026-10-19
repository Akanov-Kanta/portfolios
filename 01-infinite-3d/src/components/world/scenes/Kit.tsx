"use client";
import { useMemo } from "react";
import { useGLTF, Clone } from "@react-three/drei";
import { Color, type Group, type Mesh, type MeshStandardMaterial, type Object3D } from "three";
import type { Placement } from "./layout";
import { PALETTE } from "../theme";

export const KIT_URL = "/models/kit.glb";
export const DRACO_PATH = "/draco/";

/** kit.glb: one named wrapper node per furniture piece (see scripts/models.mjs). */
export function useKit() {
  const gltf = useGLTF(KIT_URL, DRACO_PATH);
  return useMemo(() => {
    const byName = new Map<string, Object3D>();
    const seen = new Set<MeshStandardMaterial>();
    gltf.scene.traverse((o) => {
      if (o.parent === gltf.scene) byName.set(o.name, o);
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats as MeshStandardMaterial[]) {
        if (seen.has(m)) continue;
        seen.add(m);
        // kit material tweaks (shared across clones): night-time glass, no white sills, glowing lamp shades
        if (m.name === "glass") {
          m.transparent = true;
          m.opacity = 0.18;
          m.color = new Color("#1a2a4a");
          m.roughness = 0.2;
        } else if (m.name === "_defaultMat") {
          m.color = new Color("#2a2f45");
        } else if (m.name === "lamp") {
          m.emissive = new Color(PALETTE.lamp);
          // warm enough to bloom: the lamp is the room's one warm source
          m.emissiveIntensity = 0.8;
        }
      }
    });
    return { byName, scene: gltf.scene };
  }, [gltf]);
}

export function Piece({
  p,
  byName,
  children,
  groupRef,
}: {
  p: Placement;
  byName: Map<string, Object3D>;
  children?: React.ReactNode;
  /** inner group (animated by the intro assembly) */
  groupRef?: (g: Group | null) => void;
}) {
  const obj = byName.get(p.piece);
  if (!obj) {
    if (process.env.NODE_ENV !== "production") console.warn(`kit piece missing: ${p.piece}`);
    return null;
  }
  return (
    <group position={p.position} rotation={p.rotation ?? [0, 0, 0]} scale={p.scale ?? 1}>
      <group ref={groupRef}>
        <Clone object={obj} />
        {children}
      </group>
    </group>
  );
}

useGLTF.preload(KIT_URL, DRACO_PATH);
