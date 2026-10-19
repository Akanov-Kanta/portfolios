"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { easing } from "maath";
import { SRGBColorSpace, Vector3, type PerspectiveCamera, type PointLight } from "three";
import { frame, worldStore } from "../state/world-store";
import { fx } from "../theme";

/** the resting pointer (NDC) used on touch / static / reduced motion, and before the pointer moves */
const REST = { x: 0.1, y: 0.35 };

/**
 * A small accent point light that rides the pointer ray at the current focal depth, so
 * hovering the scene lights it the way a torch would. ALWAYS mounted (with CameraRig), so
 * Warmup's compileAsync already counts it in every lit material: no recompile on first move.
 * Colour follows the mood accent; touch, static and reduced motion park it at a fixed default.
 */
export function CursorLight({ focus }: { focus: Vector3 }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const light = useRef<PointLight>(null);
  const st = useRef({ live: false, dir: new Vector3(), target: new Vector3(), ptr: { x: REST.x, y: REST.y }, last: { x: 0, y: 0 }, act: { v: 0 }, init: false });

  useEffect(() => {
    const fine = matchMedia("(pointer: fine)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => (st.current.live = fine.matches && !reduced.matches);
    on();
    fine.addEventListener("change", on);
    reduced.addEventListener("change", on);
    return () => {
      fine.removeEventListener("change", on);
      reduced.removeEventListener("change", on);
    };
  }, []);

  useFrame((_, dt) => {
    const l = light.current;
    if (!l) return;
    const s = st.current;
    const live = s.live && !frame.freeze && worldStore.getState().loopMode !== "static";
    const px = live ? frame.pointer.x : REST.x, py = live ? frame.pointer.y : REST.y;
    // pointer activity 0..1 (how much it moved lately) lifts the intensity 0.6 → 1.2
    const moved = Math.min(1, Math.hypot(px - s.last.x, py - s.last.y) * 40);
    s.last.x = px;
    s.last.y = py;
    easing.damp(s.act, "v", moved, moved > s.act.v ? 0.08 : 0.9, dt);
    easing.damp(s.ptr, "x", px, 0.12, dt);
    easing.damp(s.ptr, "y", py, 0.12, dt);
    // point on the pointer ray at the focal depth (distance to the damped look-at point)
    s.dir.set(s.ptr.x, s.ptr.y, 0.5).unproject(camera).sub(camera.position).normalize();
    const focal = Math.min(8, Math.max(1.5, camera.position.distanceTo(focus) * 0.85));
    s.target.copy(camera.position).addScaledVector(s.dir, focal);
    if (!live || !s.init) {
      s.init = true;
      l.position.copy(s.target);
    } else easing.damp3(l.position, s.target, 0.12, dt);
    l.intensity = live ? 0.6 + 0.6 * s.act.v : 0.35;
    const a = fx.mood.accent;
    l.color.setRGB(a[0], a[1], a[2], SRGBColorSpace);
  });

  return <pointLight ref={light} intensity={0.35} distance={10} decay={1.5} />;
}
