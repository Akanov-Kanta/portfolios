// Image-sequence store for scroll scrubbing.
// Frames are packed per range into .bin files (concatenated AVIF) by
// scripts/build-frames.mjs. We keep the compressed bytes in memory (~10 MB)
// and decode on demand into a small LRU of ImageBitmaps, prefetching around
// the playhead, so memory stays bounded and decoding stays off the main thread.

type Chunk = { name: string; file: string; t0: number; count: number; offsets: number[]; luma?: number[] };
type Manifest = { fps: number; width: number; height: number; chunks: Chunk[] };

type LoadedChunk = Chunk & { blobs: Blob[] | null; promise: Promise<void> | null };

const BASE = `${import.meta.env.BASE_URL}media/frames/`;

export class FrameStore {
  fps = 60;
  width = 960;
  height = 572;
  private chunks: LoadedChunk[] = [];
  private cache = new Map<number, ImageBitmap>(); // key: global frame id
  private pending = new Map<number, Promise<ImageBitmap | null>>();
  private readonly capacity: number;
  private chunkBase: number[] = [];
  onFrameReady: (() => void) | null = null;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  async init() {
    const res = await fetch(`${BASE}manifest.json`);
    const m = (await res.json()) as Manifest;
    this.fps = m.fps;
    this.width = m.width;
    this.height = m.height;
    let base = 0;
    this.chunks = m.chunks.map((c) => {
      this.chunkBase.push(base);
      base += c.count;
      return { ...c, blobs: null, promise: null };
    });
  }

  /** Download one chunk; resolves when its bytes are in memory. */
  load(name: string, onProgress?: (p: number) => void): Promise<void> {
    const c = this.chunks.find((x) => x.name === name);
    if (!c) return Promise.resolve();
    if (c.promise) return c.promise;
    c.promise = (async () => {
      const res = await fetch(BASE + c.file);
      const total = c.offsets[c.offsets.length - 1];
      let buf: Uint8Array;
      if (res.body && onProgress) {
        const reader = res.body.getReader();
        buf = new Uint8Array(total);
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf.set(value, got);
          got += value.length;
          onProgress(Math.min(1, got / total));
        }
      } else {
        buf = new Uint8Array(await res.arrayBuffer());
      }
      const whole = new Blob([buf as BlobPart], { type: 'image/avif' });
      c.blobs = [];
      for (let i = 0; i < c.count; i++) {
        c.blobs.push(whole.slice(c.offsets[i], c.offsets[i + 1], 'image/avif'));
      }
      onProgress?.(1);
    })();
    return c.promise;
  }

  loadAll() {
    return Promise.all(this.chunks.map((c) => this.load(c.name)));
  }

  /** Map a time in the source edit to a fractional global frame id. Returns -1 if not covered. */
  frameAt(t: number): number {
    for (let i = 0; i < this.chunks.length; i++) {
      const c = this.chunks[i];
      const local = (t - c.t0) * this.fps;
      if (local >= -0.5 && local <= c.count - 0.5) {
        return this.chunkBase[i] + Math.max(0, Math.min(c.count - 1, local));
      }
    }
    // nearest covered frame
    let best = 0;
    let bestD = Infinity;
    this.chunks.forEach((c, i) => {
      const s = c.t0;
      const e = c.t0 + (c.count - 1) / this.fps;
      const d = t < s ? s - t : t > e ? t - e : 0;
      if (d < bestD) {
        bestD = d;
        best = t < s ? this.chunkBase[i] : this.chunkBase[i] + c.count - 1;
      }
    });
    return best;
  }

  private locate(id: number): { c: LoadedChunk; i: number } | null {
    for (let k = this.chunks.length - 1; k >= 0; k--) {
      if (id >= this.chunkBase[k]) {
        const c = this.chunks[k];
        const i = id - this.chunkBase[k];
        return i < c.count ? { c, i } : null;
      }
    }
    return null;
  }

  /** Mean luminance (0..1) of a frame, precomputed at build time. */
  luma(id: number): number {
    const loc = this.locate(Math.round(id));
    return loc?.c.luma?.[loc.i] ?? 0;
  }

  get(id: number): ImageBitmap | null {
    const bmp = this.cache.get(id);
    if (bmp) {
      // refresh LRU position
      this.cache.delete(id);
      this.cache.set(id, bmp);
      return bmp;
    }
    return null;
  }

  /** Start decoding a frame if needed. */
  request(id: number): Promise<ImageBitmap | null> {
    const have = this.cache.get(id);
    if (have) return Promise.resolve(have);
    const p = this.pending.get(id);
    if (p) return p;
    const loc = this.locate(id);
    if (!loc || !loc.c.blobs) return Promise.resolve(null);
    const blob = loc.c.blobs[loc.i];
    const job = createImageBitmap(blob)
      .then((bmp) => {
        this.pending.delete(id);
        this.cache.set(id, bmp);
        this.evict();
        this.onFrameReady?.();
        return bmp;
      })
      .catch(() => {
        this.pending.delete(id);
        return null;
      });
    this.pending.set(id, job);
    return job;
  }

  /** Decode a window of frames around the playhead (direction-aware). */
  prefetch(id: number, dir: number, ahead = 10, behind = 3) {
    const step = dir >= 0 ? 1 : -1;
    const center = Math.round(id);
    this.request(center);
    for (let k = 1; k <= ahead; k++) this.requestSafe(center + k * step);
    for (let k = 1; k <= behind; k++) this.requestSafe(center - k * step);
  }

  private requestSafe(id: number) {
    if (id < 0 || this.pending.size > 12) return;
    if (this.locate(id)) void this.request(id);
  }

  /** Best available bitmap near id (exact if decoded, else closest decoded neighbour). */
  nearest(id: number, radius = 30): { bmp: ImageBitmap; id: number } | null {
    const exact = this.get(id);
    if (exact) return { bmp: exact, id };
    for (let r = 1; r <= radius; r++) {
      const a = this.cache.get(id - r);
      if (a) return { bmp: a, id: id - r };
      const b = this.cache.get(id + r);
      if (b) return { bmp: b, id: id + r };
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
}
