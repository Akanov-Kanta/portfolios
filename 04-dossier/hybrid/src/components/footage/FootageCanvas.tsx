"use client";

import { useEffect, useImperativeHandle, useRef, type CSSProperties, type Ref } from "react";
import { drawCover, footage, type DrawOptions } from "@/lib/footage";
import { prefersReducedMotion } from "@/lib/motion";

export interface FootageHandle {
  /** show the frame at source time `t` (seconds in the edit); decodes + prefetches around it */
  setTime: (t: number) => void;
  time: () => number;
  /** change crop/exposure options without a re-render (e.g. per-shot focus during playback) */
  setView: (view: Partial<DrawOptions>) => void;
}

interface FootageCanvasProps extends DrawOptions {
  /** source time range this canvas will scrub through: its chunks load when the canvas gets near */
  range: readonly [number, number];
  /** time of the first frame / the reduced-motion poster (default: range start) */
  at?: number;
  className?: string;
  style?: CSSProperties;
  /** how early to start downloading, as an IntersectionObserver rootMargin */
  rootMargin?: string;
  ref?: Ref<FootageHandle>;
}

const MAX_W = 1600;

/**
 * A canvas that shows the edit's footage at a given time, cover-cropped to its box (optionally to a
 * sub-region of the frame). Paints a poster JPEG first; downloads its chunks only when it comes within
 * `rootMargin` of the viewport; draws the nearest decoded frame while the exact one decodes. Under
 * reduced motion it never downloads frames and stays on the poster.
 */
export function FootageCanvas({ range, at, className = "", style, rootMargin = "150% 0px", ref, ...draw }: FootageCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const time = useRef(at ?? range[0]);
  const lastId = useRef(-1);
  const opts = useRef<DrawOptions>(draw);
  const poster = useRef<HTMLImageElement | null>(null);
  const ready = useRef(false); // chunks requested + manifest known
  const frameQueued = useRef(false);
  const paint = useRef<() => void>(() => {});
  const [t0, t1] = range;
  const { region, focusX, focusY, zoom, invert, exposure, contrast } = draw;

  useEffect(() => {
    opts.current = { region, focusX, focusY, zoom, invert, exposure, contrast };
    paint.current();
  }, [region, focusX, focusY, zoom, invert, exposure, contrast]);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d", { alpha: false });
    if (!ctx) return;
    const reduced = prefersReducedMotion();
    let alive = true;

    const doPaint = () => {
      frameQueued.current = false;
      if (!alive || !el.width) return;
      if (ready.current && !reduced) {
        const hit = footage.nearest(footage.idAt(time.current));
        if (hit) {
          drawCover(ctx, hit.bmp, hit.bmp.width, hit.bmp.height, opts.current);
          return;
        }
      }
      const p = poster.current;
      if (p) drawCover(ctx, p, p.naturalWidth, p.naturalHeight, opts.current);
    };
    paint.current = () => {
      if (frameQueued.current) return;
      frameQueued.current = true;
      requestAnimationFrame(doPaint);
    };

    const size = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.min(MAX_W, Math.round(r.width * dpr)));
      const h = Math.max(1, Math.round((w * r.height) / Math.max(1, r.width)));
      if (el.width !== w || el.height !== h) {
        el.width = w;
        el.height = h;
      }
      doPaint();
    };
    const ro = new ResizeObserver(size);
    ro.observe(el);
    size();

    void footage.poster(time.current).then((img) => {
      poster.current = img;
      if (alive) paint.current();
    });

    const unsub = footage.subscribe(() => paint.current());
    let io: IntersectionObserver | null = null;
    if (!reduced) {
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io?.disconnect();
          void footage
            .ensureRange(t0, t1)
            .then(() => {
              ready.current = true;
              const id = footage.idAt(time.current);
              lastId.current = id;
              footage.prefetch(id, 1);
              paint.current();
            })
            .catch(() => {});
        },
        { rootMargin },
      );
      io.observe(el);
    }
    return () => {
      alive = false;
      ro.disconnect();
      io?.disconnect();
      unsub();
    };
  }, [t0, t1, rootMargin]);

  useImperativeHandle(
    ref,
    () => ({
      setTime: (t: number) => {
        time.current = t;
        if (ready.current) {
          const id = footage.idAt(t);
          if (id !== lastId.current) {
            footage.prefetch(id, id - lastId.current);
            lastId.current = id;
          }
        }
        paint.current();
      },
      time: () => time.current,
      setView: (view: Partial<DrawOptions>) => {
        opts.current = { ...opts.current, ...view };
        paint.current();
      },
    }),
    [],
  );

  return <canvas ref={canvas} aria-hidden className={`block h-full w-full ${className}`} style={{ background: "var(--ink-0)", ...style }} />;
}
