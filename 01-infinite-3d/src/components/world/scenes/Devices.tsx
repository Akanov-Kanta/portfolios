"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Clone } from "@react-three/drei";
import { type GridHelper, type Group, type Object3D, type Texture, TextureLoader, SRGBColorSpace } from "three";
import { Phones } from "./Phones";
import { createDeviceLink } from "./device-link";
import { site, type Project } from "@/content/site";
import { DRACO_PATH } from "./Kit";
import { DEVICE_SPACING, VOID } from "./layout";
import { createPlaceholderShot } from "./ScreenTexture";
import { frame, holdLoad, useWorld } from "../state/world-store";
import { useLabels } from "../hud/labels-registry";
import { Vector3 } from "three";
import { projectAccent } from "../theme";
import { DeviceGlow, VoidDressing } from "./VoidDressing";
import { cull, setCulled } from "./station-window";

/**
 * x offset of device i from the stack axis: the DOM article alternates left/right and the device
 * sits on the other side; phones centre every device (the framing lens-shifts them into the slot).
 */
const sideOf = (i: number, phone: boolean) => (phone ? 0 : i % 2 ? -1.2 : 1.2);

/** devices.glb: one node per device (CC0 Poly Haven models, see public/models/CREDITS.md and scripts/models.mjs). */
const DEVICES_URL = "/models/devices.glb";

/**
 * Screen placement per device (model-local metres, from devices.glb bounds; every model faces +z):
 *   monitor (television_02)  x -0.202..0.198 y 0..0.411 z -0.228..0.122  CRT bulge peaks at z 0.122
 *   laptop  (classic_laptop) x -0.326..0.326 y 0..0.542 z -0.242..0.244  flat panel at z -0.207
 *   tv      (Television_01)  x -0.300..0.300 y 0..0.457 z -0.258..0.212  CRT bulge peaks at z 0.192
 * `centre` moves the model so the device is centred on the group origin; `scale` makes every device ≈ 2.4 m wide.
 */
const SCREEN: Record<Exclude<Project["device"], "phones">, { pos: [number, number, number]; size: [number, number]; scale: number; centre: [number, number, number] }> = {
  monitor: { pos: [-0.004, 0.259, 0.123], size: [0.28, 0.215], scale: 6, centre: [0.002, -0.206, 0.053] },
  // pushed forward so the lid (at the back of the model) sits in front of DeviceGlow's halo at z -0.45
  laptop: { pos: [0, 0.33, -0.205], size: [0.44, 0.36], scale: 3.2, centre: [0, -0.27, 0.2] },
  tv: { pos: [-0.065, 0.259, 0.194], size: [0.35, 0.265], scale: 4, centre: [0, -0.228, 0.023] },
};

/** Crop a screenshot like CSS `object-fit: cover` so a 16:10 shot fills a 4:3 CRT without stretching. */
function cover(t: Texture, imgAspect: number, screenAspect: number) {
  if (imgAspect > screenAspect) {
    t.repeat.set(screenAspect / imgAspect, 1);
    t.offset.set((1 - t.repeat.x) / 2, 0);
  } else {
    t.repeat.set(1, imgAspect / screenAspect);
    t.offset.set(0, (1 - t.repeat.y) / 2);
  }
}

function useShot(p: Project, screenAspect: number): Texture {
  return useMemo(() => {
    // drawn at the screen's own aspect, so the left-aligned title isn't cropped
    const placeholder = () => createPlaceholderShot(p.name, p.tagline, Math.round(480 * screenAspect), 480);
    if (p.screenshot) {
      // the loading screen waits for the shot (desktop), so the device never pops its screen in view
      const release = holdLoad();
      const t = new TextureLoader().load(
        p.screenshot,
        (tex) => {
          cover(tex, tex.image.width / tex.image.height, screenAspect);
          release();
        },
        undefined,
        () => {
          release();
          // missing/broken screenshot: paint the placeholder into this texture instead of a black screen
          const ph = placeholder();
          (t as Texture).image = ph.image;
          t.repeat.set(1, 1);
          t.offset.set(0, 0);
          t.needsUpdate = true;
          ph.dispose();
        },
      );
      t.colorSpace = SRGBColorSpace;
      return t;
    }
    return placeholder();
  }, [p, screenAspect]);
}

function useDevices() {
  const gltf = useGLTF(DEVICES_URL, DRACO_PATH);
  return useMemo(() => {
    const byName = new Map<string, Object3D>();
    for (const o of gltf.scene.children) byName.set(o.name, o);
    return byName;
  }, [gltf]);
}

/** Hover feedback for the device link: the device grows by this much (eased) */
const HOVER_GROW = 0.04;

function Device({ p, index, model, phone }: { p: Project; index: number; model: Object3D | undefined; phone: boolean }) {
  const g = useRef<Group>(null);
  const body = useRef<Group>(null);
  const link = useMemo(() => createDeviceLink(p.slug), [p.slug]);
  useEffect(() => (phone ? undefined : link.attach()), [link, phone]);
  const phase = index * 1.7;
  const side = sideOf(index, phone);
  // the project accent tints only the device glow (screen light, halo, streak)
  const accent = projectAccent(index);
  const scale = p.device === "phones" ? 1 : SCREEN[p.device].scale;
  useFrame((state) => {
    const o = g.current;
    if (!o) return;
    if (!frame.freeze && cull.void) {
      const t = state.clock.elapsedTime;
      o.position.y = VOID.y - index * DEVICE_SPACING + Math.sin(t * 0.6 + phase) * 0.12;
      o.rotation.y = Math.sin(t * 0.25 + phase) * 0.12;
      o.rotation.x = Math.sin(t * 0.2 + phase) * 0.05;
    }
    if (phone || !body.current) return;
    link.update(o, body.current, state.camera, state.size);
    const s = scale * (1 + HOVER_GROW * link.hover);
    if (Math.abs(body.current.scale.x - s) > 1e-4) {
      body.current.scale.setScalar(s);
      frame.dirty = Math.max(frame.dirty, 2);
    }
  });
  if (p.device !== "phones" && !model) return null;
  return (
    <group ref={g} position={[VOID.x + side, VOID.y - index * DEVICE_SPACING, VOID.z]}>
      <group ref={body} scale={scale}>
        {p.device === "phones" ? <Phones p={p} /> : <Kit p={p} device={p.device} model={model!} />}
      </group>
      <DeviceGlow index={index} />
      {/* phones: no per-device light (DeviceGlow carries the accent; the light set stays constant) */}
      {!phone && <pointLight position={[0, 0.4, 1.2]} color={accent} intensity={3} distance={6} decay={2} />}
    </group>
  );
}

/** A Poly Haven device from devices.glb with the project's screenshot on its screen. */
function Kit({ p, device, model }: { p: Project; device: keyof typeof SCREEN; model: Object3D }) {
  const cfg = SCREEN[device];
  const tex = useShot(p, cfg.size[0] / cfg.size[1]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group position={cfg.centre}>
      <Clone object={model} />
      <mesh position={cfg.pos}>
        <planeGeometry args={cfg.size} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * One floating device per project, stacked downward like igloo's ice blocks.
 * Phones: centred devices, no accent lights, and the whole stack + void dressing culled outside
 * the void window (station-window.ts).
 */
export function Devices({ bokeh }: { bokeh: number }) {
  const byName = useDevices();
  const phone = useWorld((s) => s.profile === "phone");
  const root = useRef<Group>(null);
  const grid = useRef<GridHelper>(null);
  const shown = useRef(true);
  useFrame(() => {
    if (cull.void !== shown.current) {
      shown.current = cull.void;
      setCulled(root.current, cull.void);
    }
    // the floor grid hangs just above the server room: it stays in the contact view too
    const g = grid.current, showGrid = cull.void || cull.server;
    if (g && g.visible !== showGrid) g.visible = showGrid;
  });
  useLabels(
    useMemo(
      () =>
        site.projects.map((p, i) => ({
          id: `dev-${p.slug}`,
          station: ["projects" as const],
          world: new Vector3(VOID.x + sideOf(i, phone) + (i % 2 ? -1.0 : 1.0), VOID.y - i * DEVICE_SPACING + 0.9, VOID.z + 0.3),
          side: i % 2 ? ("left" as const) : ("right" as const),
          lines: () => [`D ${p.date}`, `TEMP ${(21 + Math.sin(Date.now() / 900 + i) * 2.4).toFixed(2)}`, `${(-3 + Math.random() * 0.9).toFixed(2)}`],
        })),
      [phone],
    ),
  );
  return (
    <group ref={root}>
      <VoidDressing bokeh={bokeh} />
      {site.projects.map((p, i) => (
        <Device key={p.slug} p={p} index={i} model={byName.get(p.device)} phone={phone} />
      ))}
      {/* faint void floor grid far below the last device */}
      <gridHelper ref={grid} args={[60, 60, "#1b2140", "#141a30"]} position={[VOID.x, VOID.y - site.projects.length * DEVICE_SPACING - 2, VOID.z]} />
    </group>
  );
}

useGLTF.preload(DEVICES_URL, DRACO_PATH);
