import type { StationId } from "./state/world-store";

/** Shared art direction. Pure TS (no three / React). Owned by lane 1; other lanes import only. */
export type RGB = [number, number, number]; // sRGB 0..1 (consumers: color.setRGB(r,g,b,SRGBColorSpace))

export const PALETTE = {
  void: "#0a0b10", wall: "#151824", ink: "#e8e9f0", muted: "#9096ad",
  screen: "#6cf2ff", lamp: "#ffb86b", moon: "#8aa3ff", violet: "#9d8cff", ice: "#b5d5ff",
  fringeR: "#ff6096", fringeC: "#60e2ff",
} as const;

export const PROJECT_ACCENTS = ["#6cf2ff", "#ffb86b", "#9d8cff", "#b5d5ff"] as const;
export const projectAccent = (i: number): string =>
  PROJECT_ACCENTS[((i % PROJECT_ACCENTS.length) + PROJECT_ACCENTS.length) % PROJECT_ACCENTS.length] ?? PALETTE.screen;

export interface MoodDef {
  t: number; fog: string; fogHigh: string; fogNear: number; fogFar: number; mist: number;
  lift: string; gain: string; gamma: number; saturation: number;
  accent: string; bloomThreshold: number; vignette: number; grain: number;
}
export const MOODS: readonly MoodDef[] = [
  { t: 0 / 9, fog: "#0e0d16", fogHigh: "#1a1626", fogNear: 8, fogFar: 34, mist: 0.25, lift: "#140f1c", gain: "#fff0dc", gamma: 1.0, saturation: 0.95, accent: "#ffb86b", bloomThreshold: 0.6, vignette: 0.7, grain: 0.03 },
  { t: 2 / 9, fog: "#0d0e18", fogHigh: "#171a2a", fogNear: 8, fogFar: 30, mist: 0.2, lift: "#11101c", gain: "#fff4e6", gamma: 1.0, saturation: 0.95, accent: "#ffb86b", bloomThreshold: 0.6, vignette: 0.72, grain: 0.03 },
  { t: 4 / 9, fog: "#060a13", fogHigh: "#0c1a2a", fogNear: 10, fogFar: 60, mist: 0.45, lift: "#08121f", gain: "#dff6ff", gamma: 1.05, saturation: 0.82, accent: "#6cf2ff", bloomThreshold: 0.5, vignette: 0.78, grain: 0.035 },
  { t: 5 / 9, fog: "#07061a", fogHigh: "#1b1240", fogNear: 6, fogFar: 44, mist: 0.3, lift: "#120a28", gain: "#d6e4ff", gamma: 1.0, saturation: 1.1, accent: "#9d8cff", bloomThreshold: 0.45, vignette: 0.85, grain: 0.045 },
  { t: 6 / 9, fog: "#050a12", fogHigh: "#0b1c26", fogNear: 7, fogFar: 40, mist: 0.6, lift: "#061019", gain: "#c8f7ff", gamma: 1.02, saturation: 0.9, accent: "#6cf2ff", bloomThreshold: 0.5, vignette: 0.8, grain: 0.035 },
  { t: 7 / 9, fog: "#090a16", fogHigh: "#141a33", fogNear: 9, fogFar: 60, mist: 0.1, lift: "#0c0d1e", gain: "#e6ecff", gamma: 1.0, saturation: 0.9, accent: "#8aa3ff", bloomThreshold: 0.55, vignette: 0.75, grain: 0.03 },
];

export interface Mood {
  fog: RGB; fogHigh: RGB; fogNear: number; fogFar: number; mist: number;
  lift: RGB; gain: RGB; gamma: number; saturation: number;
  accent: RGB; bloomThreshold: number; vignette: number; grain: number;
}
export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
function toMood(d: MoodDef): Mood {
  return {
    fog: hexToRgb(d.fog), fogHigh: hexToRgb(d.fogHigh), fogNear: d.fogNear, fogFar: d.fogFar, mist: d.mist,
    lift: hexToRgb(d.lift), gain: hexToRgb(d.gain), gamma: d.gamma, saturation: d.saturation,
    accent: hexToRgb(d.accent), bloomThreshold: d.bloomThreshold, vignette: d.vignette, grain: d.grain,
  };
}
const KEYS: Mood[] = MOODS.map(toMood);
export const createMood = (): Mood => toMood(MOODS[0]!);
const l1 = (a: number, b: number, s: number) => a + (b - a) * s;
function l3(o: RGB, a: RGB, b: RGB, s: number) {
  o[0] = l1(a[0], b[0], s); o[1] = l1(a[1], b[1], s); o[2] = l1(a[2], b[2], s);
}
/** Mood at curve param t (wraps; last key blends back into MOODS[0] at t=1). Writes into `out`, no allocation. */
export function moodAt(t: number, out: Mood): Mood {
  const p = ((t % 1) + 1) % 1;
  let i = 0;
  for (let k = 0; k < MOODS.length; k++) if (MOODS[k]!.t <= p) i = k;
  const j = (i + 1) % MOODS.length;
  const t0 = MOODS[i]!.t, t1 = j === 0 ? 1 : MOODS[j]!.t;
  const x = Math.min(1, Math.max(0, (p - t0) / Math.max(1e-6, t1 - t0)));
  const s = x * x * (3 - 2 * x);
  const a = KEYS[i]!, b = KEYS[j]!;
  l3(out.fog, a.fog, b.fog, s); l3(out.fogHigh, a.fogHigh, b.fogHigh, s);
  l3(out.lift, a.lift, b.lift, s); l3(out.gain, a.gain, b.gain, s); l3(out.accent, a.accent, b.accent, s);
  out.fogNear = l1(a.fogNear, b.fogNear, s); out.fogFar = l1(a.fogFar, b.fogFar, s); out.mist = l1(a.mist, b.mist, s);
  out.gamma = l1(a.gamma, b.gamma, s); out.saturation = l1(a.saturation, b.saturation, s);
  out.bloomThreshold = l1(a.bloomThreshold, b.bloomThreshold, s); out.vignette = l1(a.vignette, b.vignette, s); out.grain = l1(a.grain, b.grain, s);
  return out;
}

export type Bezier = readonly [number, number, number, number];
export const EASE = {
  soft: [0.2, 0.7, 0.1, 1],
  hard: [0.76, 0, 0.24, 1],
  inOut: [0.5, 0, 0.1, 1],
  intro: [0.662, 0.073, 0.047, 1],
  sineOut: [0.39, 0.575, 0.565, 1],
  quartOut: [0.165, 0.84, 0.44, 1],
} as const satisfies Record<string, Bezier>;
export const cssEase = (b: Bezier): string => `cubic-bezier(${b.join(",")})`;
export const SPRING_CSS = "linear(0, 0.35 8%, 0.82 20%, 1.08 34%, 1.12 42%, 1.02 60%, 0.98 72%, 1)";
/** Cubic-bezier easing as a JS function (Newton, bisection fallback). Create once, reuse. */
export function bezier([x1, y1, x2, y2]: Bezier): (x: number) => number {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = sx(t) - x, d = dx(t);
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    if (t < 0 || t > 1 || Math.abs(sx(t) - x) > 1e-3) {
      let lo = 0, hi = 1;
      t = x;
      for (let i = 0; i < 20; i++) {
        if (sx(t) < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
    }
    return sy(t);
  };
}
export const DUR = {
  hud: 600, veil: 700, revealAlpha: 400, revealScramble: 750, lineStagger: 200, laterLineScale: 1.75,
  hoverReplay: 250, boot: 900, bootStep: 120, frost: 900, magneticReturn: 900, impulse: 3000, sfxCooldown: 400, intro: 3200,
  // phone (mirrored by the --dur-* phone tokens in globals.css)
  develop: 1200, dockIn: 420, dockOut: 240, sheetIn: 320, sheetOut: 200, jumpIn: 150, jumpOut: 220, settleDelay: 250, rest: 250, ambient: 4000,
} as const;
export const autoCenterSeconds = (distPx: number, vh: number): number =>
  Math.min(1.8, Math.max(0.9, 0.9 + (0.5 * Math.abs(distPx)) / Math.max(1, vh)));
export const GLYPHS = "!<>-_\\/[]{}—=+*^?#0123456789ABCDEF";
/** hand-held camera drift multiplier per station */
export const DRIFT: Record<StationId, number> = { hero: 1, about: 1, projects: 1.4, contact: 0.6 };

/** Per-frame shared FX values. Mutable, never React state. Single writer per field. */
export const fx = {
  /** lane 1 Atmosphere MoodDriver (useFrame priority -40) writes moodAt(frame.t); post + audio read */
  mood: createMood(),
  /** 0..1 portal-ring proximity (1 at a gate plane, 0 beyond ±1.5 units); lane 1 Portal.tsx writes, lane 2 reads */
  ring: 0,
  /** 0..1 smoothed master audio amplitude (0 when muted); lane 4 audio writes, lane 1 halo reads */
  audio: 0,
  /** signed carousel impulse, set to ±1 on change and decayed with EASE.quartOut over DUR.impulse; lane 4 writes, lane 1 reads */
  impulse: 0,
  /** adaptive feature ladder: 2 full, 1 trimmed, 0 minimal; lane 1 AdaptiveQuality writes, everyone reads */
  featureLevel: 2 as 0 | 1 | 2,
  /** 0..1 enter-project frost envelope; lane 2 Post writes, lane 4 may read for sound */
  frost: 0,
  /** 0..1 phone world-arrival envelope; Lane D's intro.ts writes it, Lane E's Grade, Room and CameraRig read it.
   *  1 means done; desktop never changes it. */
  develop: 1,
};
