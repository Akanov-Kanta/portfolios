"use client";

import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

export const FLASH_ID = "fx-flash";

export interface FlashOptions {
  /** peak opacity of the white layer (0–1) */
  intensity?: number;
  /** seconds held at peak before fading (the edit's hard cut is ~1–3 frames) */
  hold?: number;
  /** seconds to fade back out */
  fade?: number;
}

/**
 * White flash over everything: instant on (hard cut, no fade-in), short hold, quick fade.
 * Returns a timeline so it can be nested in a chapter timeline: `tl.add(flash(), "drop")`.
 * No-op (empty timeline) under reduced motion.
 */
export function flash({ intensity = 1, hold = 0.05, fade = 0.22 }: FlashOptions = {}) {
  const tl = gsap.timeline();
  const el = typeof document !== "undefined" ? document.getElementById(FLASH_ID) : null;
  if (!el || prefersReducedMotion()) return tl;
  tl.set(el, { opacity: intensity })
    .to(el, { opacity: 0, duration: fade, ease: "power2.out" }, hold);
  return tl;
}
