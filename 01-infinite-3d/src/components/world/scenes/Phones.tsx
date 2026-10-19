"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { type Group, type Texture, ExtrudeGeometry, Shape, ShapeGeometry, SRGBColorSpace, TextureLoader } from "three";
import type { Project } from "@/content/site";
import { createPlaceholderShot } from "./ScreenTexture";
import { frame, holdLoad } from "../state/world-store";

/**
 * Device "phones": three modelled phones (no glb), fanned like a hand of cards, each showing one slice of
 * the project's `screens` image (the screens side by side, ~390:844 each). Metres, facing +z, centred on
 * the origin; about as wide as the other devices (≈2.4 m).
 */
const BODY = { w: 0.74, h: 1.6, d: 0.075, r: 0.1 };
/** the display: the screenshots' 390:844 aspect, inset by a thin bezel */
const SCREEN = { w: 0.69, h: 0.69 * (844 / 390), r: 0.075 };
const FAN = [
  { x: -0.86, y: -0.06, z: -0.12, ry: 0.32, rz: 0.05 },
  { x: 0, y: 0.04, z: 0.1, ry: 0, rz: 0 },
  { x: 0.86, y: -0.06, z: -0.12, ry: -0.32, rz: -0.05 },
] as const;

function roundedRect(w: number, h: number, r: number) {
  const s = new Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** the body: a rounded slab with softened edges, centred on z 0 */
function bodyGeometry() {
  const { w, h, d, r } = BODY;
  const bevel = 0.014;
  const g = new ExtrudeGeometry(roundedRect(w - 2 * bevel, h - 2 * bevel, r - bevel), {
    depth: d - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 8,
  });
  g.translate(0, 0, -(d - 2 * bevel) / 2);
  return g;
}

/** the display, with 0..1 UVs (ShapeGeometry's UVs are its raw x / y) */
function screenGeometry() {
  const { w, h, r } = SCREEN;
  const g = new ShapeGeometry(roundedRect(w, h, r), 8);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / w + 0.5, uv.getY(i) / h + 0.5);
  return g;
}

/** one texture per phone, all sharing the `screens` image (one upload): slice i of n */
function useScreens(p: Project, n: number): Texture[] {
  return useMemo(() => {
    const slices = Array.from({ length: n }, () => null as unknown as Texture);
    const fallback = () => {
      const ph = createPlaceholderShot(p.name, p.tagline, 240, 520);
      for (const t of slices) {
        t.image = ph.image;
        t.repeat.set(1, 1);
        t.offset.set(0, 0);
        t.needsUpdate = true;
      }
      ph.dispose();
    };
    if (!p.screens) {
      // no image: every phone gets the placeholder
      const ph = createPlaceholderShot(p.name, p.tagline, 240, 520);
      return slices.map(() => ph);
    }
    // the loading screen waits for the screens (desktop), like the other devices' screenshots
    const release = holdLoad();
    const base = new TextureLoader().load(
      p.screens,
      () => {
        for (const t of slices) t.needsUpdate = true;
        release();
      },
      undefined,
      () => {
        release();
        fallback();
      },
    );
    base.colorSpace = SRGBColorSpace;
    for (let i = 0; i < n; i++) {
      const t = i === 0 ? base : base.clone();
      t.repeat.set(1 / n, 1);
      t.offset.set(i / n, 0);
      slices[i] = t;
    }
    return slices;
  }, [p, n]);
}

export function Phones({ p }: { p: Project }) {
  const tex = useScreens(p, FAN.length);
  useEffect(() => () => new Set(tex).forEach((t) => t.dispose()), [tex]);
  const geo = useMemo(() => ({ body: bodyGeometry(), screen: screenGeometry() }), []);
  useEffect(
    () => () => {
      geo.body.dispose();
      geo.screen.dispose();
    },
    [geo],
  );
  const fan = useRef<(Group | null)[]>([]);
  // each phone drifts a little on its own, inside the device's shared bob
  useFrame((state) => {
    if (frame.freeze) return;
    const t = state.clock.elapsedTime;
    fan.current.forEach((o, i) => {
      if (o) o.position.y = FAN[i].y + Math.sin(t * 0.9 + i * 2.1) * 0.025;
    });
  });
  return (
    <group>
      {FAN.map((f, i) => (
        <group
          key={i}
          ref={(o) => {
            fan.current[i] = o;
          }}
          position={[f.x, f.y, f.z]}
          rotation={[0, f.ry, f.rz]}
        >
          <mesh geometry={geo.body}>
            <meshStandardMaterial color="#14161c" metalness={0.65} roughness={0.32} />
          </mesh>
          <mesh geometry={geo.screen} position={[0, 0, BODY.d / 2 + 0.002]}>
            <meshBasicMaterial map={tex[i]} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
