"use client";

import { gsap } from "@/lib/gsap";

const band = () => {
  const top = gsap.utils.random(0, 70);
  const h = gsap.utils.random(10, 35);
  return `inset(${top.toFixed(1)}% 0% ${Math.max(0, 100 - top - h).toFixed(1)}% 0%)`;
};

export interface TiltCutOptions {
  /** seconds the tilted, shaking frame lasts before snapping back (default 0.22) */
  duration?: number;
  /** shake rate (default 18 Hz; the edit runs 15–20) */
  hz?: number;
  /** base tilt in degrees (default -4) */
  angle?: number;
  /** frame scale while tilted, so the black ground shows at the corners (default 0.9) */
  scale?: number;
  /** shake amplitude in px (default 10) / degrees (default 1.5) */
  amp?: number;
  ampRot?: number;
  /**
   * micro-cuts: every `cutEvery` seconds (default 2 frames ≈ 0.033 s) the content inside the frame
   * jumps to a related crop (scale/offset of `content`, default the frame's first child).
   * Set `content: null` to shake the frame only.
   */
  cutEvery?: number;
  content?: Element | null;
}

/**
 * The edit's scene-4 "tilted frame" (f4_008.jpg): the panel snaps to ~-4° and 0.9 scale so the black ground
 * shows at its corners, shakes in hard steps at 15–20 Hz (±10 px, ±1.5°), its content micro-cuts between
 * related crops every 2 frames, then it snaps back square. All `set`s, no tweens: it should read as cuts.
 * Returns a timeline to nest (`tl.add(tiltCut(el), t)`). Callers own reduced-motion gating.
 */
export function tiltCut(el: Element, opts: TiltCutOptions = {}) {
  const {
    duration = 0.22,
    hz = 18,
    angle = -4,
    scale = 0.9,
    amp = 10,
    ampRot = 1.5,
    cutEvery = 2 / 60,
  } = opts;
  const content = opts.content === undefined ? el.firstElementChild : opts.content;
  const tl = gsap.timeline();
  const step = 1 / hz;
  const r = gsap.utils.random;
  for (let t = 0; t < duration; t += step) {
    tl.set(el, { x: r(-amp, amp), y: r(-amp * 0.6, amp * 0.6), rotation: angle + r(-ampRot, ampRot), scale }, t);
  }
  if (content) {
    for (let t = 0; t < duration; t += cutEvery) {
      tl.set(content, { scale: r([1.08, 1.22, 1.38]), xPercent: r(-9, 9), yPercent: r(-7, 7), transformOrigin: "50% 50%" }, t);
    }
    tl.set(content, { clearProps: "transform" }, duration);
  }
  tl.set(el, { x: 0, y: 0, rotation: 0, scale: 1 }, duration);
  return tl;
}

/**
 * Strip swap/jump: 2 frames of horizontal slice glitch (bands offset sideways, grayscale, no RGB split),
 * then a short tilted-frame micro-cut shake (tiltCut), then the square strip.
 */
export function stripGlitch(el: Element) {
  return gsap
    .timeline()
    .set(el, { clipPath: band(), x: gsap.utils.random([-20, -12, 12, 20]) }, 0)
    .set(el, { clipPath: band(), x: gsap.utils.random([-10, -6, 6, 10]) }, 0.034)
    .set(el, { clipPath: "inset(0% 0% 0% 0%)", x: 0 }, 0.068)
    .add(tiltCut(el, { duration: 0.17, amp: 8 }), 0.068);
}

/** Entry: clip wipe from the right (150 ms, power4.out) while the frame lands tilted and shaking. */
export function stripSlam(el: Element) {
  return gsap
    .timeline()
    .fromTo(el, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.15, ease: "power4.out" }, 0)
    .add(tiltCut(el, { duration: 0.25 }), 0);
}

/** Camera shake on a hit: ±8 px / ±0.6° decaying over 120 ms. */
export function shake(el: Element, strength = 1) {
  const s = strength;
  return gsap.fromTo(
    el,
    { x: 0, y: 0, rotation: 0 },
    {
      keyframes: [
        { x: 8 * s, y: -5 * s, rotation: 0.6 * s },
        { x: -6 * s, y: 4 * s, rotation: -0.5 * s },
        { x: 3 * s, y: -2 * s, rotation: 0.2 * s },
        { x: 0, y: 0, rotation: 0 },
      ],
      duration: 0.12,
      ease: "none",
    },
  );
}
