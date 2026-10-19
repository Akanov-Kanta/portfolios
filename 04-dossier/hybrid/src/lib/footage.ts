"use client";

/**
 * Footage from the edit, ported from edit/src/frames.ts into a React-friendly module.
 *
 * Frames live in public/media/frames/: one .bin per time range (concatenated AVIF, 960x572: the edit's
 * frame with the burned-in bottom captions and watermark cropped off, top-left captions covered by a
 * baked black patch in 5.65–7.0 s and 9.56–11.2 s) plus manifest.json with byte offsets. A chunk is
 * downloaded only when a chapter that needs it gets close (`ensureRange`), its compressed bytes stay in
 * memory, and frames are decoded on demand (createImageBitmap) into one shared LRU of ImageBitmaps with
 * direction-aware prefetch around each playhead. Posters (public/media/posters/p-<t>.jpg) paint first
 * and are all that loads under reduced motion.
 *
 * Times are always seconds in the source edit.
 */

export type Region = { x: number; y: number; w: number; h: number };

export interface DrawOptions {
  /** sub-rectangle of the 960x572 source to cover-fit (default: whole frame) */
  region?: Region;
  /** cover-crop focus, 0..1 (default 0.5 / 0.5) */
  focusX?: number;
  focusY?: number;
  /** extra zoom on top of cover (default 1) */
  zoom?: number;
  invert?: boolean;
  /** brightness multiplier; 0.94 keeps highlights at about #F0F0F0 */
  exposure?: number;
  /** contrast, applied before exposure (so whites still land on exposure × 255) */
  contrast?: number;
}

type Chunk = { name: string; file: string; t0: number; count: number; offsets: number[] };
type Manifest = { fps: number; width: number; height: number; chunks: Chunk[] };
type LoadedChunk = Chunk & { base: number; blobs: Blob[] | null; promise: Promise<void> | null };

const BASE = "/media/";
/** Poster times available in public/media/posters (scripts/posters.mjs). */
export const POSTER_TIMES = [0.9, 1.85, 2.4, 3.3, 4.3, 5.5, 6.5, 8.3, 9.0, 10.1, 11.1] as const;
export const SOURCE = { width: 960, height: 572 } as const;

class FootageStore {
  fps = 60;
  width: number = SOURCE.width;
  height: number = SOURCE.height;
  private chunks: LoadedChunk[] = [];
  private manifest: Promise<void> | null = null;
  private cache = new Map<number, ImageBitmap>();
  private pending = new Map<number, Promise<ImageBitmap | null>>();
  private posters = new Map<number, Promise<HTMLImageElement | null>>();
  private listeners = new Set<() => void>();
  private notifyQueued = false;

  constructor(private readonly capacity: number) {}

  init(): Promise<void> {
    this.manifest ??= (async () => {
      const res = await fetch(`${BASE}frames/manifest.json`);
      if (!res.ok) throw new Error(`footage manifest ${res.status}`);
      const m = (await res.json()) as Manifest;
      this.fps = m.fps;
      this.width = m.width;
      this.height = m.height;
      let base = 0;
      this.chunks = m.chunks.map((c) => {
        const lc = { ...c, base, blobs: null, promise: null };
        base += c.count;
        return lc;
      });
    })();
    this.manifest.catch(() => {
      this.manifest = null;
    });
    return this.manifest;
  }

  /** Called (batched to one per frame) whenever a frame finishes decoding. */
  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    if (this.notifyQueued) return;
    this.notifyQueued = true;
    requestAnimationFrame(() => {
      this.notifyQueued = false;
      this.listeners.forEach((l) => l());
    });
  }

  private load(c: LoadedChunk): Promise<void> {
    c.promise ??= (async () => {
      const res = await fetch(BASE + "frames/" + c.file);
      if (!res.ok) throw new Error(`${c.file} ${res.status}`);
      const whole = new Blob([await res.arrayBuffer()], { type: "image/avif" });
      const blobs: Blob[] = [];
      for (let i = 0; i < c.count; i++) blobs.push(whole.slice(c.offsets[i], c.offsets[i + 1], "image/avif"));
      c.blobs = blobs;
      this.notify();
    })();
    c.promise.catch(() => {
      c.promise = null; // retry on the next ensure
    });
    return c.promise;
  }

  /** Download every chunk overlapping [t0, t1] (once). */
  async ensureRange(t0: number, t1: number): Promise<void> {
    await this.init();
    const end = (c: Chunk) => c.t0 + (c.count - 1) / this.fps;
    await Promise.all(this.chunks.filter((c) => end(c) >= t0 - 0.02 && c.t0 <= t1 + 0.02).map((c) => this.load(c)));
  }

  /** Global frame id for a source time (nearest covered frame when t falls in a gap). */
  idAt(t: number): number {
    let best = 0;
    let bestD = Infinity;
    for (const c of this.chunks) {
      const local = (t - c.t0) * this.fps;
      if (local >= -0.5 && local <= c.count - 0.5) return c.base + Math.max(0, Math.min(c.count - 1, Math.round(local)));
      const s = c.t0;
      const e = c.t0 + (c.count - 1) / this.fps;
      const d = t < s ? s - t : t - e;
      if (d < bestD) {
        bestD = d;
        best = t < s ? c.base : c.base + c.count - 1;
      }
    }
    return best;
  }

  private locate(id: number) {
    for (let k = this.chunks.length - 1; k >= 0; k--) {
      const c = this.chunks[k];
      if (id >= c.base) return id - c.base < c.count ? { c, i: id - c.base } : null;
    }
    return null;
  }

  private request(id: number): Promise<ImageBitmap | null> {
    const have = this.cache.get(id);
    if (have) return Promise.resolve(have);
    const p = this.pending.get(id);
    if (p) return p;
    const loc = this.locate(id);
    if (!loc?.c.blobs) return Promise.resolve(null);
    const job = createImageBitmap(loc.c.blobs[loc.i])
      .then((bmp) => {
        this.pending.delete(id);
        this.cache.set(id, bmp);
        this.evict();
        this.notify();
        return bmp;
      })
      .catch(() => {
        this.pending.delete(id);
        return null;
      });
    this.pending.set(id, job);
    return job;
  }

  /** Decode the frame at `id` and a window around it in the direction of travel. */
  prefetch(id: number, dir: number, ahead = 8, behind = 2) {
    void this.request(id);
    const step = dir >= 0 ? 1 : -1;
    for (let k = 1; k <= ahead; k++) this.requestSoft(id + k * step);
    for (let k = 1; k <= behind; k++) this.requestSoft(id - k * step);
  }

  private requestSoft(id: number) {
    if (id < 0 || this.pending.size > 10) return;
    if (this.locate(id)?.c.blobs) void this.request(id);
  }

  /** Best decoded bitmap at or near `id` (exact first, then the closest neighbour within radius). */
  nearest(id: number, radius = 24): { bmp: ImageBitmap; id: number } | null {
    const touch = (k: number) => {
      const b = this.cache.get(k);
      if (!b) return null;
      this.cache.delete(k);
      this.cache.set(k, b); // LRU refresh
      return { bmp: b, id: k };
    };
    const exact = touch(id);
    if (exact) return exact;
    for (let r = 1; r <= radius; r++) {
      const a = touch(id - r) ?? touch(id + r);
      if (a) return a;
    }
    return null;
  }

  private evict() {
    while (this.cache.size > this.capacity) {
      const oldest = this.cache.keys().next().value as number;
      this.cache.get(oldest)?.close();
      this.cache.delete(oldest);
    }
  }

  /**
   * Decode the frame at `t` (downloading its chunk if needed) and return a copy cropped to `region`, owned
   * by the caller (not in the LRU, never evicted; close() it when done). For curated stills that must show
   * instantly on a 2-frame cut.
   */
  async snapshot(t: number, region?: Region): Promise<ImageBitmap | null> {
    try {
      await this.ensureRange(t, t);
      const bmp = await this.request(this.idAt(t));
      if (!bmp) return null;
      const kx = bmp.width / SOURCE.width;
      const ky = bmp.height / SOURCE.height;
      const r = region ?? { x: 0, y: 0, w: SOURCE.width, h: SOURCE.height };
      return await createImageBitmap(bmp, Math.round(r.x * kx), Math.round(r.y * ky), Math.round(r.w * kx), Math.round(r.h * ky));
    } catch {
      return null;
    }
  }

  /** Poster closest to `t` (always available, ~5–70 KB each). */
  poster(t: number): Promise<HTMLImageElement | null> {
    const pt = POSTER_TIMES.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a));
    let p = this.posters.get(pt);
    if (!p) {
      p = new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = `${BASE}posters/p-${pt.toFixed(2)}.jpg`;
      });
      this.posters.set(pt, p);
    }
    return p;
  }
}

/** One shared store for the whole page (~24 decoded frames ≈ 50 MB worst case). */
export const footage = new FootageStore(24);

const canFilter = (() => {
  if (typeof document === "undefined") return false;
  const ctx = document.createElement("canvas").getContext("2d");
  return !!ctx && typeof ctx.filter === "string";
})();

/** Cover-fit `src` (optionally a sub-region of it) into the whole canvas, grayscale-safe. */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  srcW: number,
  srcH: number,
  { region, focusX = 0.5, focusY = 0.5, zoom = 1, invert = false, exposure = 0.94, contrast = 1 }: DrawOptions = {},
) {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  // posters and frames share the 960x572 coordinate space; scale regions to the actual source size
  const kx = srcW / SOURCE.width;
  const ky = srcH / SOURCE.height;
  const r = region ? { x: region.x * kx, y: region.y * ky, w: region.w * kx, h: region.h * ky } : { x: 0, y: 0, w: srcW, h: srcH };
  const rc = cw / ch;
  const rr = r.w / r.h;
  let sw = rr > rc ? r.h * rc : r.w;
  let sh = rr > rc ? r.h : r.w / rc;
  sw /= zoom;
  sh /= zoom;
  const sx = r.x + (r.w - sw) * focusX;
  const sy = r.y + (r.h - sh) * focusY;
  ctx.save();
  if (canFilter) ctx.filter = `grayscale(1) contrast(${contrast}) brightness(${exposure})${invert ? " invert(1)" : ""}`;
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, cw, ch);
  ctx.restore();
  if (invert && !canFilter) {
    ctx.save();
    ctx.globalCompositeOperation = "difference";
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  }
}
