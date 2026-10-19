import type { Tier } from "./state/world-store";

/**
 * Per-tier budget. The feature flags are the ceiling; at runtime fx.featureLevel (AdaptiveQuality)
 * trims below it: level 1 halves smoke/bokeh and drops the text cylinder's second pass, level 0 is minimal.
 *   smoke     SmokeRibbons strips per placement
 *   shafts    window light-shaft cones (low: one)
 *   fogNoise  value-noise modulation of the height mist (fog-chunks)
 *   bokeh     void bokeh quads
 *   iceCut    lane 2's dual-render diagonal cut
 *   reflect   server-room floor planar reflection (512² target, reflection layer only, contact-gated;
 *             dropped at featureLevel 0)
 *   floorGrid cursor-revealed accent grid on the server-room floor (fine pointers, not reduced motion)
 */
export const TIERS = {
  high: { dprMax: 1.5, dust: 1500, stars: 4000, orbs: 80000, bloom: true, bloomLevels: 6, iceCut: true, smoke: 5, shafts: 3, fogNoise: true, bokeh: 40, reflect: true, floorGrid: true },
  medium: { dprMax: 1.25, dust: 900, stars: 2500, orbs: 42000, bloom: true, bloomLevels: 4, iceCut: false, smoke: 3, shafts: 3, fogNoise: true, bokeh: 28, reflect: false, floorGrid: true },
  low: { dprMax: 1, dust: 400, stars: 1200, orbs: 18000, bloom: false, bloomLevels: 0, iceCut: false, smoke: 0, shafts: 1, fogNoise: false, bokeh: 12, reflect: false, floorGrid: true },
} as const;
export type LiveTier = keyof typeof TIERS;
/** Phone scene profile (worldStore.profile === "phone"). TIERS stay untouched so weak desktops keep "low". */
export const PHONE = { dprMax: 1.5, dprLadder: [1, 1.25, 1.5], dust: 250, stars: 800, orbs: 18000, glyphs: 120, bloom: false, bloomLevels: 0, iceCut: false, smoke: 0, shafts: 1, fogNoise: false, bokeh: 8, reflect: false, floorGrid: false, msaa: 4 } as const;

const KEY = "portfolio.gpu";

/** One-time device probe. `?q=high|medium|low|static` overrides; the result is cached per session. */
export function detectQuality(): Tier {
  if (typeof window === "undefined") return "medium";
  const q = new URLSearchParams(location.search).get("q");
  if (q === "high" || q === "medium" || q === "low" || q === "static") return q;
  try {
    const cached = sessionStorage.getItem(KEY) as Tier | null;
    if (cached) return cached;
  } catch {}
  const tier = probe();
  try {
    sessionStorage.setItem(KEY, tier);
  } catch {}
  return tier;
}

function probe(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const coarse = matchMedia("(pointer: coarse)").matches;
  const cores = nav.hardwareConcurrency ?? 4;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false });
  if (!gl) return "static";
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = (dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "") as string;
  const r = renderer.toLowerCase();
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  if (/swiftshader|llvmpipe|software/.test(r)) return "static";
  if (coarse || innerWidth < 768 || cores <= 4 || nav.connection?.saveData || (nav.deviceMemory ?? 8) <= 2 || /mali|adreno|powervr/.test(r)) return "low";
  if (/intel|iris|uhd|apu|radeon\(tm\) graphics/.test(r)) return "medium";
  // Apple silicon reports "Apple M1/M2..." → treat as high; discrete NVIDIA/AMD → high
  if (/apple|nvidia|geforce|rtx|radeon rx|arc/.test(r) && cores >= 8) return "high";
  return "medium";
}
