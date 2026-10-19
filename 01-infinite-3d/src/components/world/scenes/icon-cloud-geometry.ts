import { Color } from "three";
import { SOCIAL_ICONS } from "@/components/home/social-icons";
import { rng } from "./rng";
import { PALETTE } from "../theme";
import { smoothstep as smooth } from "../math";

export interface CloudShape {
  positions: Float32Array; // xyz per orb, object local space, centred on the origin
}

export interface CloudPalette {
  colors: Float32Array;
  sizes: Float32Array;
  seeds: Float32Array;
}

// theme palette: ice body, slate shadowed orbs, a few screen-cyan and violet sparks
const ICE = new Color(PALETTE.ice);
const SLATE = new Color("#7f8bb0");
const CYAN = new Color(PALETTE.screen);
const BRAND = new Color(PALETTE.violet);

/** Per-orb colour / size / phase. Shared by every shape so a morph only moves points. */
export function makePalette(count: number): CloudPalette {
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const r = rng(77);
  const tmp = new Color();
  for (let i = 0; i < count; i++) {
    const k = r();
    tmp.copy(k < 0.05 ? CYAN : k < 0.09 ? BRAND : k < 0.5 ? SLATE : ICE);
    tmp.multiplyScalar(0.8 + r() * 0.3);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
    sizes[i] = 0.7 + Math.pow(r(), 1.6) * 0.7;
    seeds[i] = r() * Math.PI * 2;
  }
  return { colors, sizes, seeds };
}

function svgFor(key: string, px: number): string {
  const def = SOCIAL_ICONS[key] ?? SOCIAL_ICONS.globe;
  const inner = def.inner.replace(/currentColor/g, "#fff");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="${def.vb}">${inner}</svg>`;
}

function rasterise(key: string, px: number): Promise<Uint8ClampedArray> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = px;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      // ~8% padding so strokes at the viewBox edge are not clipped
      const pad = px * 0.08;
      ctx.drawImage(img, pad, pad, px - pad * 2, px - pad * 2);
      resolve(ctx.getImageData(0, 0, px, px).data);
    };
    img.onerror = reject;
    img.src = "data:image/svg+xml," + encodeURIComponent(svgFor(key, px));
  });
}

/**
 * Turn a brand glyph into an extruded solid made of `count` orbs (igloo's footer object).
 * The SVG is rasterised once (fills and strokes both work), then points are sampled on the
 * front/back faces and along the extruded rim, so the solid reads as thick sculpted logo.
 *  - size: object height/width in world units (glyph fits inside)
 *  - depth: extrusion thickness
 */
export async function buildIconShape(key: string, count: number, size = 3.3, depth = 0.6, px = 256): Promise<CloudShape> {
  const data = await rasterise(key, px);
  const inside: number[] = [];
  const rim: number[] = [];
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= px || y >= px ? 0 : data[(y * px + x) * 4 + 3]);
  for (let y = 0; y < px; y++)
    for (let x = 0; x < px; x++) {
      if (at(x, y) < 128) continue;
      inside.push(y * px + x);
      if (at(x - 1, y) < 128 || at(x + 1, y) < 128 || at(x, y - 1) < 128 || at(x, y + 1) < 128) rim.push(y * px + x);
    }
  const positions = new Float32Array(count * 3);
  const r = rng(key.length * 131 + 7);
  // the rim gets a share proportional to its length, but at least a third so edges stay crisp
  const rimShare = Math.min(0.6, Math.max(0.34, (rim.length * 6) / Math.max(1, inside.length)));
  for (let i = 0; i < count; i++) {
    const onRim = rim.length > 0 && r() < rimShare;
    const pool = onRim ? rim : inside;
    const idx = pool[Math.floor(r() * pool.length)] ?? 0;
    const px_ = idx % px, py_ = Math.floor(idx / px);
    const x = (px_ + r() - px / 2) / px * size;
    const y = (px / 2 - (py_ + r())) / px * size;
    let z: number;
    if (onRim) z = (r() - 0.5) * depth;
    else {
      const face = r() < 0.5 ? 1 : -1;
      z = face * (depth / 2 - Math.pow(r(), 2.2) * depth * 0.28); // faces, with a little inward fuzz
    }
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return { positions };
}

/*
 * Morph timing (seconds). Orb i leaves at s_i · MORPH_SPREAD (s_i = its 0..1 phase), rides the
 * curl swirl for MORPH_TRAVEL, and its position follows its own underdamped spring step response,
 * which settles with a small overshoot. The oscillation is faded to exactly 1 by MORPH_SETTLE
 * (local time), so the whole morph is over at MORPH_END. GLSL mirrors morphK (IconCloud).
 */
export const MORPH_SPREAD = 0.44;
export const MORPH_TRAVEL = 0.66;
export const MORPH_SETTLE = 1.5;
export const MORPH_END = MORPH_SPREAD + MORPH_SETTLE;

const fract = (x: number) => x - Math.floor(x);

/** the orb's 0..1 departure phase from its seed (same as the shader's `s`) */
export const orbPhase = (seed: number): number => fract(seed * 0.15915494);

/**
 * Per-orb morph progress at local time t (s since the orb left): 0 → 1 along an underdamped
 * spring step response, stiffness ω 6.2..8.6 rad/s and damping ζ 0.58..0.74 hashed from the seed
 * (≈3..11 % overshoot), so the logo lands with a small organic wobble instead of one uniform ease.
 */
export function morphK(t: number, seed: number): number {
  if (t <= 0) return 0;
  if (t >= MORPH_SETTLE) return 1;
  const w = 6.2 + 2.4 * fract(seed * 5.13 + 0.37);
  const z = 0.58 + 0.16 * fract(seed * 9.71 + 0.83);
  const a = z * w, wd = w * Math.sqrt(1 - z * z);
  const e = Math.exp(-a * t) * (Math.cos(wd * t) + (a / wd) * Math.sin(wd * t));
  return 1 - e * (1 - smooth(MORPH_SETTLE - 0.35, MORPH_SETTLE, t));
}
