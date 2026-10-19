"use client";
import { useEffect, useRef } from "react";

/**
 * Magnetic pull toward the cursor with a damped spring (the motion.dev feel, without shipping
 * the library: a ~20-line spring that only runs while it is moving). Off under reduced motion.
 * Mouse and pen only: a finger never drags the target (and a tap never leaves a transform behind).
 */
const aims = (e: PointerEvent) => e.pointerType === "mouse" || e.pointerType === "pen";
export function Magnetic({ children, strength = 0.28, className = "" }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, raf = 0;
    const tick = () => {
      vx = (vx + (tx - x) * 0.16) * 0.74; // stiffness, damping
      vy = (vy + (ty - y) * 0.16) * 0.74;
      x += vx;
      y += vy;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      raf = Math.abs(vx) + Math.abs(vy) + Math.abs(tx - x) + Math.abs(ty - y) > 0.04 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (!aims(e)) return;
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * strength;
      ty = (e.clientY - (r.top + r.height / 2)) * strength;
      kick();
    };
    const onLeave = (e: PointerEvent) => {
      if (!aims(e)) return;
      tx = ty = 0;
      kick();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);
  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {children}
    </span>
  );
}
