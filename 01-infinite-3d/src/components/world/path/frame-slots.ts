import { worldStore } from "../state/world-store";
import type { Rect } from "./framing";

/**
 * The DOM frame slots the phone layout leaves for the 3D subjects: [data-frame-slot="device"]
 * (keyed by data-project-index) and [data-frame-slot="orb"], as rects relative to their closest
 * [data-slot-root] (which coincides with the viewport at rest), in CSS px. A zero rect (the slot
 * is display:none, e.g. on desktop) is no slot. Lives in the world chunk; CameraRig installs it on
 * phones and re-solves the framing whenever `version` changes. Never measured per frame.
 */
export const frameSlots = { device: new Map<number, Rect>(), orb: null as Rect | null, version: 0 };

function relRect(el: Element): Rect | null {
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  const root = el.closest("[data-slot-root]")?.getBoundingClientRect();
  return { x: r.left - (root?.left ?? 0), y: r.top - (root?.top ?? 0), w: r.width, h: r.height };
}

const same = (a: Rect | null | undefined, b: Rect | null | undefined) =>
  a === b || (!!a && !!b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5);

export function measureSlots(): void {
  const device = new Map<number, Rect>();
  let orb: Rect | null = null;
  for (const el of document.querySelectorAll<HTMLElement>("[data-frame-slot]")) {
    const kind = el.dataset.frameSlot;
    if (kind !== "device" && kind !== "orb") continue;
    const r = relRect(el);
    if (!r) continue;
    if (kind === "orb") orb ??= r;
    else {
      const i = Number(el.dataset.projectIndex ?? 0) || 0;
      if (!device.has(i)) device.set(i, r);
    }
  }
  let changed = !same(orb, frameSlots.orb) || device.size !== frameSlots.device.size;
  for (const [i, r] of device) if (!same(r, frameSlots.device.get(i))) changed = true;
  if (!changed) return;
  frameSlots.device = device;
  frameSlots.orb = orb;
  frameSlots.version++;
}

/** re-measure only on a width or orientation change (a mobile toolbar only changes the height) */
const WIDTH_DEBOUNCE_MS = 300;
/** a route's DOM commits before WorldRoot mirrors the pathname; re-check as late parts settle */
const ROUTE_CHECKS_MS = [0, 300, 1000] as const;

/** Measure now and on width / orientation change, fonts.ready and route changes. Returns the uninstall. */
export function installFrameSlots(): () => void {
  let alive = true;
  let raf = 0;
  const timers = new Set<number>();
  const run = () => {
    if (alive) measureSlots();
  };
  const later = (ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      run();
    }, ms);
    timers.add(id);
  };
  const burst = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(run);
    for (const ms of ROUTE_CHECKS_MS) if (ms > 0) later(ms);
  };
  run();
  burst();

  let w = window.innerWidth;
  const landscape = () => window.innerWidth > window.innerHeight;
  let land = landscape();
  let resizeId = 0;
  const onResize = () => {
    if (window.innerWidth === w && landscape() === land) return;
    w = window.innerWidth;
    land = landscape();
    window.clearTimeout(resizeId);
    resizeId = window.setTimeout(run, WIDTH_DEBOUNCE_MS);
  };
  window.addEventListener("resize", onResize, { passive: true });
  document.fonts?.ready.then(run).catch(() => {});
  const unsub = worldStore.subscribe((s, prev) => {
    if (s.route !== prev.route || s.isHome !== prev.isHome) burst();
  });
  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    window.clearTimeout(resizeId);
    timers.forEach((id) => window.clearTimeout(id));
    window.removeEventListener("resize", onResize);
    unsub();
  };
}
