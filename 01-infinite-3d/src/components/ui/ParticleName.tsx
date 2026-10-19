"use client";
import { useEffect, useRef } from "react";

/**
 * Cursor-driven particle typography (componentry.dev): the heading is drawn as a dot matrix
 * sampled from its own glyphs; dots scatter away from the pointer and spring back.
 *
 * The real text stays in the DOM (it is the LCP element, selectable and read by screen readers).
 * Only once the canvas has drawn does the text turn transparent, via [data-particles="on"].
 * Reduced motion keeps the plain text. The loop only runs while dots are moving or the pointer is
 * near, so an idle hero costs nothing. Rest positions are a fixed grid, so the hero and its loop
 * clone render identically.
 */
export function ParticleName({ words, as: Tag = "h1", className = "" }: { words: string[]; as?: "h1" | "p"; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = wrap.current!, el = title.current!, cv = canvas.current!;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const PAD = 64;
    const R = 96; // pointer radius, css px
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let n = 0;
    let hx = new Float32Array(0), hy = hx, x = hx, y = hx, vx = hx, vy = hx;
    let dot = 3, W = 0, H = 0, raf = 0, awake = false;
    let px = -1e4, py = -1e4; // pointer, client coords
    // the canvas rect, cached: measured in pointer events (where layout is clean), on every build (a resize /
    // font swap, next to its own layout reads) and, while the dots are awake, in scroll and resize events (the
    // name moves under a resting cursor). The per-frame step reads only this cache: a layout read there, after
    // the other rAF writers ran, forced a synchronous layout every frame. At rest a scroll never measures (a
    // read in every scroll event forced a style recalc per event per instance on phones, where nothing wakes
    // the dots while scrolling); the next pointermove re-measures before it can wake them.
    let rl = 0, rt = 0, rw = 0, rh = 0;
    const onScroll = () => {
      if (awake) measure();
    };
    const measure = () => {
      const r = cv.getBoundingClientRect();
      rl = r.left;
      rt = r.top;
      rw = r.width;
      rh = r.height;
    };
    let color = "#e8e9f0";

    const build = () => {
      const r = box.getBoundingClientRect();
      if (r.width < 2) return;
      // before the size writes below: layout is still clean, and the canvas's corner does not depend on its size
      measure();
      W = Math.ceil(r.width + PAD * 2);
      H = Math.ceil(r.height + PAD * 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      const cs = getComputedStyle(el);
      color = cs.getPropertyValue("--pt-color").trim() || "#e8e9f0";
      const fs = parseFloat(cs.fontSize);
      // raster the glyphs at 1x, positioned exactly where each DOM line sits
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      (o as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = cs.letterSpacing;
      o.fillStyle = "#fff";
      o.textBaseline = "alphabetic";
      el.querySelectorAll<HTMLElement>("[data-word]").forEach((span) => {
        const s = span.getBoundingClientRect();
        const m = o.measureText(span.textContent ?? "");
        const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
        const base = s.top - r.top + PAD + (s.height - (asc + desc)) / 2 + asc; // CSS half-leading
        o.fillText(span.textContent ?? "", s.left - r.left + PAD, base);
      });
      const data = o.getImageData(0, 0, W, H).data;
      const gap = Math.max(3, Math.round(fs / 30));
      dot = Math.max(1.6, gap * 0.62);
      const xs: number[] = [], ys: number[] = [];
      for (let yy = 0; yy < H; yy += gap)
        for (let xx = 0; xx < W; xx += gap) if (data[(yy * W + xx) * 4 + 3] > 140) {
            xs.push(xx);
            ys.push(yy);
          }
      n = xs.length;
      hx = Float32Array.from(xs);
      hy = Float32Array.from(ys);
      x = hx.slice();
      y = hy.slice();
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      draw();
      box.dataset.particles = "on";
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = color;
      const h = dot / 2;
      for (let i = 0; i < n; i++) ctx.fillRect(x[i] - h, y[i] - h, dot, dot);
    };

    const step = () => {
      const mx = px - rl, my = py - rt;
      let moving = false;
      const R2 = R * R;
      for (let i = 0; i < n; i++) {
        const dx = x[i] - mx, dy = y[i] - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / R) * 2.4;
          vx[i] += (dx / d) * f;
          vy[i] += (dy / d) * f;
        }
        vx[i] = (vx[i] + (hx[i] - x[i]) * 0.07) * 0.84; // spring home, damped
        vy[i] = (vy[i] + (hy[i] - y[i]) * 0.07) * 0.84;
        x[i] += vx[i];
        y[i] += vy[i];
        if (!moving && (Math.abs(vx[i]) > 0.02 || Math.abs(vy[i]) > 0.02 || Math.abs(hx[i] - x[i]) > 0.1)) moving = true;
      }
      draw();
      const near = mx > -R && my > -R && mx < W + R && my < H + R;
      if (moving || near) raf = requestAnimationFrame(step);
      else awake = false;
    };

    const wake = () => {
      if (awake || !n) return;
      awake = true;
      raf = requestAnimationFrame(step);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      measure();
      if (px > rl - R && px < rl + rw + R && py > rt - R && py < rt + rh + R) wake();
    };
    const onLeave = () => {
      px = py = -1e4;
    };

    let built = false;
    const rebuild = () => {
      built = true;
      build();
    };
    document.fonts.ready.then(rebuild).catch(rebuild);
    const ro = new ResizeObserver(() => built && build());
    ro.observe(box);
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener("pointermove", onMove);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      delete box.dataset.particles;
    };
  }, []);

  return (
    <div ref={wrap} className="pt-wrap relative">
      <Tag ref={title} className={`pt-title ${className}`}>
        {words.map((w, i) => (
          <span key={i} data-word className="block">
            {w}
          </span>
        ))}
      </Tag>
      <canvas ref={canvas} aria-hidden="true" className="pt-canvas pointer-events-none absolute" style={{ left: -64, top: -64 }} />
    </div>
  );
}
