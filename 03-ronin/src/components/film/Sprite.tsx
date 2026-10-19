"use client";

import { useEffect, useRef } from "react";
import { preload } from "react-dom";
import { sprites, type SpriteName } from "@/sprites";
import { onFrame } from "@/lib/animator";
import { createWind, type Wind } from "@/lib/wind-gl";

/**
 * A character drawn on twos: one strip of frames, played from its exposure sheet while its shot is on
 * screen (the shot's data-live), frozen on the first drawing otherwise. Server-rendered as a plain CSS
 * background showing frame 0, so it works without JS and with reduced motion. Sprites with a wind mask
 * are redrawn through the WebGL wind shader once their shot comes near.
 */
export function Sprite({ name, className = "", f, eager = false }: { name: SpriteName; className?: string; f?: string; eager?: boolean }) {
  const def = sprites[name];
  const ref = useRef<HTMLDivElement>(null);
  if (eager) preload(def.src, { as: "image", fetchPriority: "high" });

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const shot = el.closest<HTMLElement>("[data-shot]");
    const seq = def.seq;
    const beat = "beat" in def ? def.beat : undefined;
    const emit = "emit" in def ? def.emit : undefined;
    const wind = "wind" in def ? def.wind : undefined;

    let i = 0;
    let held = 0;
    let shown = -1;
    let live = shot?.dataset.live === "true";
    let gl: Wind | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let glWanted = false;
    let ro: ResizeObserver | null = null;

    const show = (frame: number) => {
      if (frame === shown) return;
      shown = frame;
      if (!gl) el.style.backgroundPosition = def.n > 1 ? `${(frame / (def.n - 1)) * 100}% 0` : "0 0";
      if (emit?.includes(frame)) window.dispatchEvent(new CustomEvent("film:frame", { detail: { name, frame } }));
    };

    // the wind shader is set up lazily, the first time the shot comes near
    const setupWind = async () => {
      if (!wind || glWanted) return;
      glWanted = true;
      const load = (src: string) => {
        const im = new Image();
        im.decoding = "async";
        im.src = src;
        return im.decode().then(() => im);
      };
      try {
        const [img, mask] = await Promise.all([load(def.src), load(wind.mask)]);
        if (!ref.current) return;
        canvas = document.createElement("canvas");
        canvas.className = "sprite-gl";
        canvas.setAttribute("aria-hidden", "true");
        gl = createWind(canvas, img, mask, def.n, wind.amp);
        if (!gl) {
          canvas = null;
          return;
        }
        el.appendChild(canvas);
        const dprCap = window.innerWidth < 768 ? 1.5 : 2;
        const fit = () => {
          const dpr = Math.min(dprCap, window.devicePixelRatio || 1);
          gl?.resize(Math.max(1, Math.round(el.clientWidth * dpr)), Math.max(1, Math.round(el.clientHeight * dpr)));
        };
        fit();
        ro = new ResizeObserver(fit);
        ro.observe(el);
        gl.draw(Math.max(0, shown), performance.now() / 1000);
        el.classList.add("gl");
      } catch {
        /* keep the CSS sprite */
      }
    };

    const watch = () => {
      live = shot?.dataset.live === "true";
      if (shot?.dataset.near === "true" || live) setupWind();
    };
    watch();
    const mo = shot ? new MutationObserver(watch) : null;
    mo?.observe(shot!, { attributes: true, attributeFilter: ["data-live", "data-near"] });

    const onBeat = (e: Event) => {
      const d = (e as CustomEvent<{ name: string; on: boolean }>).detail;
      if (!beat || d.name !== beat.name) return;
      i = d.on ? beat.at : 0;
      held = 0;
      show(seq[i][0]);
    };
    window.addEventListener("film:beat", onBeat);

    show(seq[0][0]);
    const off = onFrame((now, dt) => {
      if (!live) return;
      held += dt;
      while (held >= seq[i][1]) {
        held -= seq[i][1];
        i = (i + 1) % seq.length;
      }
      show(seq[i][0]);
      gl?.draw(shown, now / 1000);
    });

    return () => {
      off();
      mo?.disconnect();
      ro?.disconnect();
      window.removeEventListener("film:beat", onBeat);
      gl?.destroy();
      canvas?.remove();
      el.classList.remove("gl");
      el.style.backgroundPosition = "";
    };
  }, [def, name]);

  return (
    <div
      ref={ref}
      className={`sprite ${className}`}
      data-f={f}
      role="img"
      aria-label={def.alt}
      style={{
        aspectRatio: `${def.w} / ${def.h}`,
        backgroundImage: `url(${def.src})`,
        backgroundSize: `${def.n * 100}% 100%`,
      }}
    />
  );
}
