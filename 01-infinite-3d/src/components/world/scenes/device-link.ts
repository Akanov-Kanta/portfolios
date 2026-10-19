import { Box3, Matrix4, Vector3, type Camera, type Mesh, type Object3D } from "three";

/**
 * Desktop device links: each project article holds an invisible fixed link, [data-device-link=<slug>]
 * (Projects.tsx), and its device keeps it over its own on-screen box every frame, so clicking the device
 * opens the project (the same href, cursor and transition as the article's Open button). Phones tap the
 * frame-slot link instead. The link only shows while its article is in view: elsewhere a device can still
 * project into the viewport behind the room's walls.
 */

/** px rect in viewport space, or null when the box is behind the camera or off screen */
export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Screen rect of NDC points (x, y in -1..1, z > 1 = behind the camera), clipped to the viewport (pure;
 * device-link.test.ts). Null if any point is behind the camera or nothing is left on screen.
 */
export function ndcRect(points: readonly { x: number; y: number; z: number }[], vw: number, vh: number): Rect | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of points) {
    if (p.z > 1 || p.z < -1) return null;
    const x = ((p.x + 1) / 2) * vw, y = ((1 - p.y) / 2) * vh;
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  x0 = Math.max(0, x0);
  y0 = Math.max(0, y0);
  x1 = Math.min(vw, x1);
  y1 = Math.min(vh, y1);
  if (x1 - x0 < 1 || y1 - y0 < 1) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** `body`'s mesh bounds in `root`'s local space (root's own bob / sway moves the box with it). */
function localBox(root: Object3D, body: Object3D): Box3 {
  root.updateWorldMatrix(true, true);
  const inv = new Matrix4().copy(root.matrixWorld).invert();
  const box = new Box3(), b = new Box3(), m = new Matrix4();
  body.traverse((o) => {
    const geo = (o as Mesh).geometry;
    if (!(o as Mesh).isMesh || !geo) return;
    if (!geo.boundingBox) geo.computeBoundingBox();
    box.union(b.copy(geo.boundingBox!).applyMatrix4(m.multiplyMatrices(inv, o.matrixWorld)));
  });
  return box;
}

const corners = Array.from({ length: 8 }, () => new Vector3());
/** how often a missing link is looked up again (the home page may mount after the world) */
const REQUERY_FRAMES = 30;

export function createDeviceLink(slug: string) {
  let el: HTMLElement | null = null;
  let io: IntersectionObserver | null = null;
  let inView = false;
  let hovered = false;
  let box: Box3 | null = null;
  let boxScale = 0;
  let last = "";
  let wait = 0;
  const onEnter = () => (hovered = true);
  const onLeave = () => (hovered = false);

  const detach = () => {
    io?.disconnect();
    io = null;
    el?.removeEventListener("pointerenter", onEnter);
    el?.removeEventListener("pointerleave", onLeave);
    if (el) el.style.visibility = "";
    el = null;
    inView = hovered = false;
    last = "";
  };
  const find = () => {
    detach();
    el = document.querySelector<HTMLElement>(`[data-device-link="${CSS.escape(slug)}"]`);
    if (!el) return;
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    const article = el.closest("article") ?? el.parentElement;
    if (!article) return;
    io = new IntersectionObserver((es) => {
      for (const e of es) inView = e.isIntersecting;
    });
    io.observe(article);
  };
  let attached = false;

  const hide = () => {
    if (el && last !== "hidden") {
      el.style.visibility = "";
      last = "hidden";
    }
    hovered = false;
  };

  const link = {
    /** 0..1, eased toward the pointer being over the link */
    hover: 0,
    /** start tracking (desktop); returns the cleanup */
    attach() {
      attached = true;
      find();
      return () => {
        attached = false;
        detach();
      };
    },
    /** call every frame after the device moved: `root` bobs, `body` holds the meshes (and the hover scale) */
    update(root: Object3D, body: Object3D, camera: Camera, size: { width: number; height: number }) {
      if (!attached) return;
      if (!el?.isConnected) {
        if (wait-- > 0) return;
        wait = REQUERY_FRAMES;
        find();
        if (!el) return;
      }
      link.hover += ((hovered ? 1 : 0) - link.hover) * 0.18;
      if (Math.abs(link.hover - (hovered ? 1 : 0)) < 1e-3) link.hover = hovered ? 1 : 0;
      if (!inView) return hide();
      // measured without the hover growth, so the box doesn't chase its own scale
      if (!box || box.isEmpty()) {
        boxScale = body.scale.x;
        box = localBox(root, body);
        if (box.isEmpty()) return hide();
      }
      root.updateWorldMatrix(false, false);
      // the scene's draw doesn't keep the camera's world matrix current (Sky.tsx, MonitorDive.tsx do the same)
      camera.updateMatrixWorld();
      const { min, max } = box;
      const k = body.scale.x / boxScale;
      for (let i = 0; i < 8; i++) {
        corners[i]
          .set(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z)
          .multiplyScalar(k)
          .applyMatrix4(root.matrixWorld)
          .project(camera);
      }
      const r = ndcRect(corners, size.width, size.height);
      if (!r) return hide();
      const key = `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;
      if (key === last) return;
      last = key;
      const s = el.style;
      s.transform = `translate3d(${Math.round(r.x)}px,${Math.round(r.y)}px,0)`;
      s.width = `${Math.round(r.w)}px`;
      s.height = `${Math.round(r.h)}px`;
      s.visibility = "visible";
    },
  };
  return link;
}
