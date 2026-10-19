"use client";

import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/%<>+=_";
const tweens = new WeakMap<HTMLElement, gsap.core.Tween>();

/**
 * Signal-A's metadata decode: the text scrambles and settles left to right over `duration` seconds
 * (glyphs change every other frame). Monospace only, so the width never moves. The final text is the
 * element's text at first call (kept in data-text). Reduced motion: no-op.
 */
export function scramble(el: HTMLElement, duration = 0.45) {
  if (prefersReducedMotion()) return;
  const final = (el.dataset.text ??= el.textContent ?? "");
  tweens.get(el)?.kill();
  const proxy = { p: 0 };
  let frame = 0;
  const tween = gsap.to(proxy, {
    p: 1,
    duration,
    ease: "none",
    onUpdate: () => {
      if (frame++ % 2) return;
      const settled = Math.floor(proxy.p * (final.length + 4)) - 4;
      let out = "";
      for (let i = 0; i < final.length; i++) {
        const c = final[i];
        out += c === " " || i < settled ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = final;
    },
  });
  tweens.set(el, tween);
}

/** Stops a running scramble and puts the final text back at once (a row losing the pointer is a hard cut). */
export function unscramble(el: HTMLElement) {
  tweens.get(el)?.kill();
  tweens.delete(el);
  if (el.dataset.text !== undefined) el.textContent = el.dataset.text;
}
