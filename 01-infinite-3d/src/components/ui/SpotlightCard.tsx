"use client";
import { useRef } from "react";

/**
 * Magic UI "magic card": a glass panel whose fill and 1px border light up around the cursor.
 * The pointer position is written to CSS variables directly (no React state per move).
 */
export function SpotlightCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onPointerMove={onMove} className={`spot-card ${className}`}>
      {children}
    </div>
  );
}
