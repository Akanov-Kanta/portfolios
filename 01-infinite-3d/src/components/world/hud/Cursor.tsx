"use client";
import { useEffect, useRef } from "react";
import { addTick } from "../ticker";
import { installMagnetic } from "./magnetic";
import { EASE as THEME_EASE, cssEase } from "../theme";
import { glyphAt } from "./Scramble";

type Kind = "none" | "link" | "open" | "prev" | "next";
const RING = 28; // px, resting ring diameter
/** ring follow rate (1/s, ~28ms time constant) and the most it may trail the pointer, px */
const FOLLOW = 36, LEASH = 10;
const EASE = cssEase(THEME_EASE.soft);
/** cursor-trail re-scramble: above this pointer speed (px/s) the Scramble letter under the
 *  pointer and SPREAD neighbours each side flip to glyphs for about TRAIL_MS */
const TRAIL_SPEED = 1400, TRAIL_MS = 160, SPREAD = 1;
const SHAPE =`width 300ms ${EASE}, height 300ms ${EASE}, border-radius 300ms ${EASE}, border-color 200ms ${EASE}, background-color 200ms ${EASE}, scale 200ms ${EASE}`;

/**
 * Mono crosshair cursor (fine pointers, motion allowed only): a "+" that tracks instantly and
 * stretches slightly along its velocity, and a ring that lags and reads `[data-cursor]`:
 *   link → grows · open → a pill with "[ OPEN ]" (data-cursor-text) tinted by data-cursor-accent
 *   prev / next → arrow glyphs · data-cursor-stick → the ring is drawn to the element's centre.
 * Plain links / buttons without data-cursor still count as "link". Also installs the magnetic
 * controls (hud/magnetic.ts). Everything is inline style; native cursor + focus rings are
 * untouched on touch or reduced motion.
 */
export function Cursor() {
  const cross = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.dataset.cursor = "on";
    const magnetic = installMagnetic();
    const p = {
      x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2, px: innerWidth / 2, py: innerHeight / 2,
      vx: 0, vy: 0, seen: false,
      kind: "none" as Kind, label: "", accent: "", stick: null as Element | null,
      shown: "" /* last applied ring state key */,
      over: null as Element | null /* Scramble letter (.sc-c) under the pointer */,
    };
    /** letters flipped by the trail and when they settle; Scramble's own runs overwrite freely */
    const trail = new Map<Element, number>();
    const onMove = (e: PointerEvent) => {
      p.x = e.clientX;
      p.y = e.clientY;
      p.seen = true;
      const t = e.target as Element | null;
      p.over = t?.classList.contains("sc-c") ? t : null;
      // <html data-cursor="on"> is the hide-native-cursor flag, not a hover target
      const el = t?.closest<HTMLElement>("[data-cursor]:not(html)");
      if (el) {
        const k = el.dataset.cursor as Kind;
        p.kind = k === "open" || k === "prev" || k === "next" || k === "link" ? k : "link";
        p.label = el.dataset.cursorText ?? (p.kind === "open" ? "OPEN" : "");
        p.accent = el.dataset.cursorAccent ?? "";
        p.stick = el.hasAttribute("data-cursor-stick") ? el : null;
      } else {
        p.kind = t?.closest("a, button, [role=button], input, textarea, select, label") ? "link" : "none";
        p.label = p.accent = "";
        p.stick = null;
      }
    };
    const onLeave = () => (p.seen = false);
    addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    const applyRing = (r: HTMLDivElement, tx: HTMLSpanElement) => {
      const key = `${p.kind}|${p.label}|${p.accent}`;
      if (key === p.shown) return;
      p.shown = key;
      const accent = p.accent || "";
      const pill = p.kind === "open";
      const arrow = p.kind === "prev" || p.kind === "next";
      tx.textContent = pill ? `[ ${p.label.toUpperCase()} ]` : arrow ? (p.kind === "prev" ? "←" : "→") : "";
      tx.style.opacity = pill || arrow ? "1" : "0";
      tx.style.color = accent || "";
      const w = pill ? Math.ceil(tx.scrollWidth) + 26 : arrow ? 44 : RING;
      r.style.width = `${w}px`;
      r.style.height = `${pill ? 30 : arrow ? 44 : RING}px`;
      r.style.borderRadius = "999px";
      r.style.borderColor = accent || (p.kind === "none" ? "" : "rgba(232,233,240,.8)");
      r.style.backgroundColor = pill ? "rgba(10,11,16,.72)" : "";
      r.style.scale = p.kind === "link" ? "1.8" : "1";
    };

    const off = addTick((_, dt) => {
      const c = cross.current, r = ring.current, tx = text.current;
      if (!c || !r || !tx) return;
      magnetic.step(dt);
      // ring target: the pointer, or mostly the sticky element's centre
      let gx = p.x, gy = p.y;
      if (p.stick) {
        const b = p.stick.getBoundingClientRect();
        gx = b.left + b.width / 2 + (p.x - (b.left + b.width / 2)) * 0.15;
        gy = b.top + b.height / 2 + (p.y - (b.top + b.height / 2)) * 0.15;
      }
      const k = 1 - Math.exp(-FOLLOW * dt);
      p.rx += (gx - p.rx) * k;
      p.ry += (gy - p.ry) * k;
      // leash: on fast moves the lag never lets the ring drift off the pointer (sticky targets
      // pull it away on purpose, so they're exempt)
      if (!p.stick) {
        const dx = p.rx - gx, dy = p.ry - gy, d = Math.hypot(dx, dy);
        if (d > LEASH) {
          p.rx = gx + (dx / d) * LEASH;
          p.ry = gy + (dy / d) * LEASH;
        }
      }
      // cross velocity (px/s, damped) → stretch along the direction of travel, ≤ 1.15
      const inv = 1 / Math.max(1e-3, dt);
      const kv = 1 - Math.exp(-10 * dt);
      p.vx += ((p.x - p.px) * inv - p.vx) * kv;
      p.vy += ((p.y - p.py) * inv - p.vy) * kv;
      p.px = p.x;
      p.py = p.y;
      const speed = Math.hypot(p.vx, p.vy);
      const sx = 1 + Math.min(0.15, speed / 12000);
      const ang = Math.atan2(p.vy, p.vx);
      const hot = p.kind !== "none" ? Math.PI / 4 : 0;
      c.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${ang}rad) scaleX(${sx.toFixed(3)}) rotate(${(hot - ang).toFixed(4)}rad)`;
      applyRing(r, tx);
      // cursor-trail re-scramble: a fast pass over Scramble text briefly flips the letters it
      // crosses (DOM attributes only, no React state); they settle back on their own
      const now = performance.now();
      if (p.over && speed > TRAIL_SPEED) {
        let a: Element | null = p.over;
        for (let k = 0; k < SPREAD && a.previousElementSibling; k++) a = a.previousElementSibling;
        for (let k = 0; a && k <= SPREAD * 2; k++, a = a.nextElementSibling) {
          if (!trail.has(a)) trail.set(a, now + TRAIL_MS + k * 25);
        }
        p.over = null;
      }
      if (trail.size) {
        let i = 0;
        for (const [el, until] of trail) {
          if (now > until) {
            el.removeAttribute("data-g");
            trail.delete(el);
          } else el.setAttribute("data-g", glyphAt(i, now));
          i++;
        }
      }
      // position via the `translate` property: the individual `scale` (link hover) composes after
      // it, so it grows the ring in place instead of scaling its screen position
      r.style.translate = `${p.rx}px ${p.ry}px`;
      c.style.opacity = r.style.opacity = p.seen ? "1" : "0";
    }, 20);
    return () => {
      off();
      trail.forEach((_, el) => el.removeAttribute("data-g"));
      magnetic.dispose();
      removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      delete document.documentElement.dataset.cursor;
    };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-50" aria-hidden="true">
      <div ref={cross} className="absolute left-0 top-0 h-3 w-3 opacity-0" style={{ marginLeft: -6, marginTop: -6 }}>
        <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-ink" />
        <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-ink" />
      </div>
      <div
        ref={ring}
        className="absolute left-0 top-0 flex items-center justify-center overflow-hidden rounded-full border border-ink/50 opacity-0"
        style={{ width: RING, height: RING, transition: SHAPE, transform: "translate(-50%, -50%)", transformOrigin: "0 0" }}
      >
        <span ref={text} className="label whitespace-nowrap text-ink opacity-0 transition-opacity duration-200" />
      </div>
    </div>
  );
}
