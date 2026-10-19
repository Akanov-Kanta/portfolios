"use client";
import { useEffect, useEffectEvent, useRef, type CSSProperties } from "react";
import { DUR, EASE, GLYPHS, bezier } from "../theme";
import { rng } from "../scenes/rng";
import { clamp01 } from "../math";

const sineOut = bezier(EASE.sineOut);
/** width of the alpha front, as a fraction of the string */
const W = 0.1;

/** igloo's two fronts. Char i of n turns real once the scramble front passes i/n ... */
export const resolveAt = (i: number, n: number) => i / Math.max(1, n);
/** ... and fades in as the (faster) alpha front sweeps over it. */
export const alphaAt = (p1: number, i: number, n: number) => clamp01((p1 * (1 + W) - i / Math.max(1, n)) / W);
/** A glyph that changes every ~50 ms and differs per position. */
export const glyphAt = (i: number, now: number) =>
  GLYPHS[((Math.imul(i + 1, 2654435761) ^ Math.imul(Math.floor(now / 50) + 1, 40503)) >>> 0) % GLYPHS.length] ?? "#";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
/** Deterministic per-letter lift (em) for the igloo lockup: same text + seed = same offsets (SSR-safe). */
export function lockupLift(text: string, seed: number): number[] {
  const r = rng(hash(text) + seed * 131);
  return Array.from(text, (ch) => (ch === " " ? 0 : Math.round((r() * 2 - 1) * 70) / 1000));
}

type Mode = "full" | "quick";

interface Props {
  text: string;
  /** play the reveal on mount (otherwise only when `text` changes) */
  initial?: boolean;
  /** replay a quick scramble when the closest interactive ancestor is hovered / focused */
  replayOnHover?: boolean;
  /** line index in a multi-line block: delayed by DUR.lineStagger, later lines run x DUR.laterLineScale */
  line?: number;
  /** bump to replay the full reveal (ScrambleOnView) */
  trigger?: number;
  /** HUD module index: replays on the 'hud:boot' event, staggered by DUR.bootStep */
  boot?: number;
  /** per-letter lockup offsets from this seed (static, kept under reduced motion) */
  lockup?: number;
  className?: string;
}

/**
 * igloo-style text reveal: an alpha front (DUR.revealAlpha) and a scramble front
 * (DUR.revealScramble) sweep left to right, both sineOut. Chars are rendered once by React;
 * the animation writes their opacity / glyph directly (no re-render per frame). A scrambling
 * char keeps its real letter as the (transparent) layout box, so nothing reflows.
 * Screen readers get the final text (an sr-only copy); reduced motion shows it instantly.
 */
export function Scramble({ text, initial = false, replayOnHover = false, line = 0, trigger = 0, boot, lockup, className }: Props) {
  const root = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);
  const mounted = useRef(false);

  const play = useEffectEvent((mode: Mode, delay = 0) => {
    const el = root.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chars = [...el.querySelectorAll<HTMLSpanElement>(".sc-c")];
    const n = chars.length;
    if (!n) return;
    cancelAnimationFrame(raf.current);
    const scale = line > 0 ? DUR.laterLineScale : 1;
    const aDur = mode === "quick" ? 0 : DUR.revealAlpha * scale;
    const sDur = mode === "quick" ? DUR.hoverReplay : DUR.revealScramble * scale;
    const wait = delay + (mode === "full" ? line * DUR.lineStagger : 0);
    const start = performance.now();
    const tick = (now: number) => {
      const e = now - start - wait;
      const p1 = aDur ? sineOut(clamp01(e / aDur)) : 1;
      const p2 = e < 0 ? 0 : sineOut(clamp01(e / sDur));
      for (let i = 0; i < n; i++) {
        const c = chars[i]!;
        const a = e < 0 && aDur ? 0 : alphaAt(p1, i, n);
        c.style.opacity = a >= 1 ? "" : a.toFixed(3);
        if (p2 >= 1 || p2 > resolveAt(i, n)) c.removeAttribute("data-g");
        else c.setAttribute("data-g", glyphAt(i, now));
      }
      if (p2 < 1 || p1 < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  });

  // text change (or mount with `initial`), and explicit replays
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      if (!initial) return;
    }
    play("full");
  }, [text, trigger, initial]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useEffect(() => {
    if (!replayOnHover) return;
    const host = root.current?.closest<HTMLElement>('a, button, [role="button"], [data-cursor]');
    if (!host) return;
    const go = () => play("quick");
    host.addEventListener("pointerenter", go);
    host.addEventListener("focus", go);
    return () => {
      host.removeEventListener("pointerenter", go);
      host.removeEventListener("focus", go);
    };
  }, [replayOnHover]);

  useEffect(() => {
    if (boot === undefined) return;
    const go = () => play("full", boot * DUR.bootStep + 160);
    window.addEventListener("hud:boot", go);
    return () => window.removeEventListener("hud:boot", go);
  }, [boot]);

  const lift = lockup === undefined ? null : lockupLift(text, lockup);
  let k = 0;
  const parts = text.split(/( +)/);
  return (
    // screen readers read the sr-only copy (aria-label on a generic span is ignored outside WebKit)
    <span ref={root} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {parts.map((w, wi) => {
          if (!w) return null;
          if (w.trim() === "") {
            k += w.length;
            return w;
          }
          return (
            <span key={wi} className="sc-w">
              {Array.from(w, (ch, ci) => {
                const y = lift?.[k];
                k++;
                const style: CSSProperties | undefined = y ? { translate: `0 ${y}em` } : undefined;
                return (
                  <span key={ci} className="sc-c" style={style}>
                    {ch}
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
    </span>
  );
}
