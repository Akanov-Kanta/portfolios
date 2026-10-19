"use client";

import { useEffect, useRef } from "react";

const TILE = 192; // px; one noise tile, repeated

/**
 * Film grain for almost no cost: one noise tile is generated once (JS), then the oversized `.fx-grain`
 * layer jumps between 8 offsets with a `steps(1)` CSS animation (globals.css). No per-frame JS, no
 * per-frame pixels, no `filter`. Overlay-blended so flat blacks stay #000 and mid-tones get the texture.
 * `fps` sets the jump rate (default 10, like a projected print); reduced motion = static grain.
 */
export function Grain({ fps = 10 }: { fps?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = TILE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(TILE, TILE);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      // luminance noise centred on mid-grey (overlay's neutral), roughly gaussian (sum of two uniforms)
      const v = 128 + (Math.random() + Math.random() - 1) * 110;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    el.style.setProperty("--noise", `url(${canvas.toDataURL("image/png")})`);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="fx-grain"
      style={{ zIndex: "var(--z-fx)", animationDuration: `${8 / fps}s` }}
    />
  );
}
