// Footage clips for the shader scenes (ported from variant B's frames.ts).
// Each clip is one .bin of concatenated AVIF frames + byte offsets in manifest.json
// (built by scripts/build-frames.mjs). A clip is only downloaded when its scene is near
// (`ensure`), the compressed bytes stay in memory, and frames are decoded on demand into a
// small LRU of ImageBitmaps with direction-aware prefetch around the playhead.

export type ClipName = 'hero' | 'outro';

interface ClipInfo {
  name: ClipName;
  file: string;
  fps: number;
  t0: number;
  count: number;
  width: number;
  height: number;
  offsets: number[];
  luma?: number[];
}

interface Clip extends ClipInfo {
  blobs: Blob[] | null;
  promise: Promise<void> | null;
  cache: Map<number, ImageBitmap>;
  pending: Map<number, Promise<ImageBitmap | null>>;
  poster: HTMLImageElement | null;
  posterPromise: Promise<HTMLImageElement | null> | null;
}

const BASE = `${import.meta.env.BASE_URL}media/`;

export class Footage {
  private clips = new Map<ClipName, Clip>();
  private readonly capacity: number;
  private manifest: Promise<void> | null = null;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  init(): Promise<void> {
    this.manifest ??= (async () => {
      const res = await fetch(`${BASE}frames/manifest.json`);
      if (!res.ok) throw new Error(`manifest ${res.status}`);
      const m = (await res.json()) as { clips: ClipInfo[] };
      for (const c of m.clips) {
        this.clips.set(c.name, {
          ...c, blobs: null, promise: null, cache: new Map(), pending: new Map(), poster: null, posterPromise: null,
        });
      }
    })();
    return this.manifest;
  }

  info(name: ClipName): { width: number; height: number; fps: number; t0: number; count: number } | null {
    const c = this.clips.get(name);
    return c ? { width: c.width, height: c.height, fps: c.fps, t0: c.t0, count: c.count } : null;
  }

  isLoaded(name: ClipName): boolean {
    return !!this.clips.get(name)?.blobs;
  }

  isRequested(name: ClipName): boolean {
    return !!this.clips.get(name)?.promise;
  }

  /** Download one clip (once); resolves when its bytes are in memory. */
  ensure(name: ClipName, onProgress?: (p: number) => void): Promise<void> {
    const c = this.clips.get(name);
    if (!c) return Promise.resolve();
    if (c.promise) return c.promise;
    c.promise = (async () => {
      const res = await fetch(BASE + 'frames/' + c.file);
      if (!res.ok) throw new Error(`${c.file} ${res.status}`);
      const total = c.offsets[c.offsets.length - 1];
      let buf: Uint8Array;
      if (res.body && onProgress) {
        const reader = res.body.getReader();
        buf = new Uint8Array(total);
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf.set(value.subarray(0, Math.max(0, Math.min(value.length, total - got))), got);
          got += value.length;
          onProgress(Math.min(1, got / total));
        }
      } else {
        buf = new Uint8Array(await res.arrayBuffer());
      }
      const whole = new Blob([buf as BlobPart], { type: 'image/avif' });
      const blobs: Blob[] = [];
      for (let i = 0; i < c.count; i++) blobs.push(whole.slice(c.offsets[i], c.offsets[i + 1], 'image/avif'));
      c.blobs = blobs;
      onProgress?.(1);
    })();
    c.promise.catch(() => {
      // allow a retry on the next ensure()
      c.promise = null;
    });
    return c.promise;
  }

  /** JPEG poster of a clip: first paint, slow networks and reduced motion. */
  poster(name: ClipName): HTMLImageElement | null {
    const c = this.clips.get(name);
    return c?.poster ?? null;
  }

  loadPoster(name: ClipName): Promise<HTMLImageElement | null> {
    const c = this.clips.get(name);
    if (!c) return Promise.resolve(null);
    c.posterPromise ??= new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        c.poster = img;
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = `${BASE}poster-${name}.jpg`;
    });
    return c.posterPromise;
  }

  /** Map a time in the source edit to a fractional frame index of the clip. */
  frameAt(name: ClipName, t: number): number {
    const c = this.clips.get(name);
    if (!c) return 0;
    return Math.max(0, Math.min(c.count - 1, (t - c.t0) * c.fps));
  }

  get(name: ClipName, id: number): ImageBitmap | null {
    const c = this.clips.get(name);
    const bmp = c?.cache.get(id);
    if (!c || !bmp) return null;
    c.cache.delete(id);
    c.cache.set(id, bmp);
    return bmp;
  }

  request(name: ClipName, id: number): Promise<ImageBitmap | null> {
    const c = this.clips.get(name);
    if (!c || id < 0 || id >= c.count) return Promise.resolve(null);
    const have = c.cache.get(id);
    if (have) return Promise.resolve(have);
    const p = c.pending.get(id);
    if (p) return p;
    if (!c.blobs) return Promise.resolve(null);
    const job = createImageBitmap(c.blobs[id])
      .then((bmp) => {
        c.pending.delete(id);
        c.cache.set(id, bmp);
        this.evict(c);
        return bmp;
      })
      .catch(() => {
        c.pending.delete(id);
        return null;
      });
    c.pending.set(id, job);
    return job;
  }

  /** Decode a window of frames around the playhead (direction-aware). */
  prefetch(name: ClipName, id: number, dir: number, ahead = 10, behind = 3): void {
    const c = this.clips.get(name);
    if (!c?.blobs) return;
    const step = dir >= 0 ? 1 : -1;
    const center = Math.round(id);
    void this.request(name, center);
    for (let k = 1; k <= ahead; k++) this.requestSafe(c, center + k * step);
    for (let k = 1; k <= behind; k++) this.requestSafe(c, center - k * step);
  }

  private requestSafe(c: Clip, id: number) {
    if (id < 0 || id >= c.count || c.pending.size > 12) return;
    void this.request(c.name, id);
  }

  /** Best available bitmap near id (exact if decoded, else the closest decoded neighbour). */
  nearest(name: ClipName, id: number, radius = 30): { bmp: ImageBitmap; id: number } | null {
    const c = this.clips.get(name);
    if (!c) return null;
    const exact = this.get(name, id);
    if (exact) return { bmp: exact, id };
    for (let r = 1; r <= radius; r++) {
      const a = c.cache.get(id - r);
      if (a) return { bmp: a, id: id - r };
      const b = c.cache.get(id + r);
      if (b) return { bmp: b, id: id + r };
    }
    return null;
  }

  private evict(c: Clip) {
    while (c.cache.size > this.capacity) {
      const oldest = c.cache.keys().next().value as number;
      c.cache.get(oldest)?.close();
      c.cache.delete(oldest);
    }
  }
}
