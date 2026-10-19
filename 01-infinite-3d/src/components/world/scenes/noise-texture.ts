import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RGBAFormat, RepeatWrapping, UnsignedByteType } from "three";
import { rng } from "./rng";

const SIZE = 128;
let tex: DataTexture | null = null;

/** Tiling value noise on a `period`-cell lattice (wraps at the texture edge). */
function valueNoise(period: number, seed: number): Float32Array {
  const r = rng(seed);
  const lattice = Float32Array.from({ length: period * period }, () => r());
  const out = new Float32Array(SIZE * SIZE);
  const at = (x: number, y: number) => lattice[(((y % period) + period) % period) * period + (((x % period) + period) % period)]!;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const fx = (x / SIZE) * period, fy = (y / SIZE) * period;
      const ix = Math.floor(fx), iy = Math.floor(fy);
      let u = fx - ix, v = fy - iy;
      u = u * u * (3 - 2 * u);
      v = v * v * (3 - 2 * v);
      const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
      out[y * SIZE + x] = a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
  }
  return out;
}

/**
 * One tiling 128² RGBA noise texture for every procedural shader (smoke, shafts, bokeh, post):
 *   R  value noise, two octaves (16 + 32 cells)
 *   G  blocky cells (8×8 px steps, random per cell) for glitch/materialise masks
 *   B  low-frequency value noise (4 cells)
 *   A  1
 * Generated once on first use; shared and never disposed. Read-only for consumers.
 */
export function getNoiseTexture(): DataTexture {
  if (tex) return tex;
  const hi = valueNoise(16, 11), hi2 = valueNoise(32, 12), lo = valueNoise(4, 13);
  const r = rng(14);
  const cells = Float32Array.from({ length: (SIZE / 8) * (SIZE / 8) }, () => r());
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      data[i * 4] = Math.round((hi[i]! * 0.65 + hi2[i]! * 0.35) * 255);
      data[i * 4 + 1] = Math.round(cells[(y >> 3) * (SIZE / 8) + (x >> 3)]! * 255);
      data[i * 4 + 2] = Math.round(lo[i]! * 255);
      data[i * 4 + 3] = 255;
    }
  }
  tex = new DataTexture(data, SIZE, SIZE, RGBAFormat, UnsignedByteType);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}
