import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

export type StationId = "hero" | "about" | "projects" | "contact";
export const STATIONS: readonly StationId[] = ["hero", "about", "projects", "contact"];
export const STATION_LABEL: Record<StationId, string> = {
  hero: "HOME",
  about: "ABOUT",
  projects: "PROJECTS",
  contact: "CONTACT",
};

/** loop: Lenis infinite (desktop). touch-wrap: native scroll + jump at rest. finite: inner pages. static: reduced motion / loop off. */
export type LoopMode = "loop" | "touch-wrap" | "finite" | "static";
export type Tier = "high" | "medium" | "low" | "static";
/** 3D / render-policy profile: "phone" when PHONE_MQ matched at hydration (components/world/phone.ts) */
export type Profile = "desktop" | "phone";

export interface Segment {
  from: StationId;
  to: StationId;
  /** document-space px */
  start: number;
  holdEnd: number;
  end: number;
  /** curve params; t1 may exceed 1 on the seam segment */
  t0: number;
  t1: number;
  /** projects: how many sub-stops (one per project) the segment holds */
  stops: number;
}
export interface Mapping {
  segments: Segment[];
  limit: number;
  /** viewport height used for the measurement */
  vh: number;
}

export interface WorldState {
  isHome: boolean;
  loopMode: LoopMode;
  /** where the current route parks the camera */
  route: StationId;
  /** nearest station (HUD) */
  station: StationId;
  tier: Tier;
  webglReady: boolean;
  /** completed laps (HUD hint hides after the first) */
  laps: number;
  /** the canvas is mounting */
  mounting: boolean;
  /** world assets still arriving after the Suspense boundary resolved (screenshots, orb logos): holdLoad() */
  loads: number;
  /** desktop: late assets compiled and the first frames rendered behind the loading screen */
  settled: boolean;
  /** desktop: the loading screen is gone (hud/IntroLoader.tsx) */
  revealed: boolean;
  /** igloo-style intro: scroll is locked while it plays */
  intro: "pending" | "playing" | "done";
  /** synthesized ambient sound (off by default) */
  sound: boolean;
  /** "phone" when PHONE_MQ matched at hydration. WorldRoot writes it once; the 3D profile and the render policy read it. */
  profile: Profile;
  /** IndexSheet writes it; the render policy freezes WebGL while it is "menu". */
  sheet: "none" | "menu";
  /** WorldRoot writes it when the idle auto-mount was skipped (Save-Data or 2G). */
  worldDeferred: boolean;
  /** requestWorld() writes it; WorldRoot mounts on it. */
  worldRequested: boolean;
  set: (patch: Partial<Omit<WorldState, "set">>) => void;
}

export const worldStore = createStore<WorldState>()((set) => ({
  isHome: true,
  loopMode: "finite",
  route: "hero",
  station: "hero",
  tier: "medium",
  webglReady: false,
  laps: 0,
  mounting: false,
  loads: 0,
  settled: false,
  revealed: false,
  intro: "pending",
  sound: false,
  profile: "desktop",
  sheet: "none",
  worldDeferred: false,
  worldRequested: false,
  set: (patch) => set(patch),
}));

/** Keep the loading screen up until this asset has arrived. Returns the release (safe to call twice). */
export function holdLoad(): () => void {
  const store = worldStore.getState();
  store.set({ loads: store.loads + 1 });
  let held = true;
  return () => {
    if (!held) return;
    held = false;
    worldStore.getState().set({ loads: worldStore.getState().loads - 1 });
  };
}

export const useWorld = <T,>(selector: (s: WorldState) => T): T => useStore(worldStore, selector);

/** Per-frame values. Mutable, never React state. Written by the scroll layer + WorldDriver, read in useFrame. */
export const frame = {
  /** px, already wrapped in loop mode */
  scrollY: 0,
  /** px, scrollHeight - innerHeight */
  limit: 1,
  /** Lenis velocity (px per frame) */
  velocityPx: 0,
  /** 0..1 damped |velocity| */
  vNorm: 0,
  /** camera curve parameter, [0,1) */
  t: 0,
  /** 0..1 bell inside a boundary window */
  transition: 0,
  /** 0..1 progress inside the current boundary window */
  local: 0,
  /** viewports scrolled into the current segment (projects: device index = min(vhIn, stops-1)) */
  vhIn: 0,
  /** station the current segment departs from / arrives at, and how many sub-stops it holds */
  segFrom: "hero" as StationId,
  segTo: "hero" as StationId,
  stops: 1,
  mapping: null as Mapping | null,
  /** NDC, damped by the consumer */
  pointer: { x: 0, y: 0 },
  /** ?freeze=1 → deterministic frames for seam/pixel tests */
  freeze: false,
  /** frames still to render in "static" mode */
  dirty: 3,
  /** intro progress 0..1 (1 when done or skipped) */
  introT: 0,
  /** performance.now() until which CameraRig snaps to the pose and route flights cut. requestCut() writes it. */
  cutUntil: 0,
  /** performance.now() until which the phone render policy renders at full rate. wake() writes it. */
  wakeUntil: 0,
  /** false: frame.pointer is parked and must not drive parallax, tilt or flee */
  pointerLive: true,
};

export function wake(ms: number): void { frame.wakeUntil = Math.max(frame.wakeUntil, performance.now() + ms); }
export function requestCut(ms = 400): void { frame.cutUntil = performance.now() + ms; frame.dirty = Math.max(frame.dirty, 3); wake(ms + 200); }
export function requestWorld(): void { worldStore.getState().set({ worldRequested: true }); }

/** Time held still: reduced motion (loopMode static) or deterministic ?freeze frames. */
export function isCalm(): boolean {
  return frame.freeze || worldStore.getState().loopMode === "static";
}
