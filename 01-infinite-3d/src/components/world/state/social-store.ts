import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { DUR, EASE, bezier, fx } from "../theme";
import { emitSfx } from "../sfx-bus";
import { addTick } from "../ticker";

/** Which social the footer carousel has selected. Written by the DOM carousel, read by the 3D icon. */
export interface SocialState {
  index: number;
  count: number;
  key: string;
  label: string;
  href: string;
  set: (patch: Partial<Omit<SocialState, "set" | "step">>) => void;
  /** move the selection by `dir` (wraps); side arrows and the label row both call this */
  step: (dir: number) => void;
}

/** direction of the last step() (the dots jump, so their direction is the shorter way round) */
let lastDir: -1 | 1 | 0 = 0;

export const socialStore = createStore<SocialState>()((set, get) => ({
  index: 0,
  count: 0,
  key: "globe",
  label: "",
  href: "",
  set: (patch) => set(patch),
  step: (dir) => {
    const n = get().count;
    if (n < 2) return;
    lastDir = dir < 0 ? -1 : 1;
    set({ index: (get().index + dir + n * 1000) % n });
  },
}));

export const useSocial = <T,>(selector: (s: SocialState) => T): T => useStore(socialStore, selector);

/**
 * The orb logo on screen (desktop): centre and half-size in canvas CSS px (the canvas is the viewport
 * there). IconCloud writes it every rendered frame; OrbLink (ticker +10, after R3F) puts the link on it.
 * `on` is false while the cloud is not drawn or behind the camera.
 */
export const orbScreen = { x: 0, y: 0, half: 0, on: false };

/**
 * Carousel impulse: on a selection change fx.impulse jumps to ±1 (direction of travel) and
 * decays to 0 on EASE.quartOut over DUR.impulse; the scene reads it to spin the same way.
 * The morph sound fires with it. Reduced motion: no impulse (the logo swaps instantly).
 */
const decay = bezier(EASE.quartOut);
let offDecay: (() => void) | null = null;
function kick(dir: -1 | 1) {
  emitSfx("morph", { dir });
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    fx.impulse = 0;
    return;
  }
  const start = performance.now();
  fx.impulse = dir;
  offDecay?.();
  offDecay = addTick((now) => {
    const k = Math.min(1, (now - start) / DUR.impulse);
    fx.impulse = dir * (1 - decay(k));
    if (k >= 1) {
      fx.impulse = 0;
      offDecay?.();
      offDecay = null;
    }
  }, 12);
}

if (typeof window !== "undefined") {
  socialStore.subscribe((s, prev) => {
    if (s.index === prev.index || s.count < 2) return;
    let dir = lastDir;
    if (!dir) {
      const fwd = (s.index - prev.index + s.count) % s.count;
      dir = fwd <= s.count / 2 ? 1 : -1;
    }
    lastDir = 0;
    kick(dir);
  });
}
