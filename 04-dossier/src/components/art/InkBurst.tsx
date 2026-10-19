"use client";

import { useEffect, useRef } from "react";
import { renderBurst, type BurstOptions } from "./ink-burst";

interface InkBurstProps extends BurstOptions {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The feathered white burst as a canvas. Generated once per option set (cached), copied in on mount, so
 * several chapters can show the identical burst for seamless hard cuts. Size and position come from the
 * caller (className/style); the bitmap keeps its aspect via object-fit. Animate a wrapper, not this.
 */
export function InkBurst({ className = "", style, ...opts }: InkBurstProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { seed, cx, cy, radius, strokes, lobes, width = 1600, height = 1000 } = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const src = renderBurst({ seed, cx, cy, radius, strokes, lobes, width, height });
    el.width = src.width;
    el.height = src.height;
    el.getContext("2d")?.drawImage(src, 0, 0);
  }, [seed, cx, cy, radius, strokes, lobes, width, height]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      width={width}
      height={height}
      className={className}
      style={{ filter: "blur(0.6px)", objectFit: "contain", ...style }}
    />
  );
}
