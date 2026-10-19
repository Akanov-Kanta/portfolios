"use client";

/**
 * TypeCaption: the edit's tiny glowing ALL-CAPS caption that types itself on.
 *
 * Look (tokens.css, `.tc-*`): Quicksand, `--caption-size`, line-height 1.26, +0.035em. tone="light"
 * (default) = #f0f0f0 + the three-layer "deep glow" for dark grounds. tone="dark" = #222 weight 500 with
 * a soft dark halo for light grounds (inverted chapters, text on the ink burst).
 *
 * Motion: one CSS variable `--p` (characters typed, a float) drives every character. A char cuts in at
 * `dim` (no fade, no cursor) once `--p` passes it, holds dim for `lag` seconds' worth of chars, then
 * brightens to full and gets its glow over `brighten` seconds' worth of chars. GSAP tweens or scrubs a
 * single number, so there are no per-char tweens and the same progress can be driven by time or scroll.
 *
 * Props
 *   label?    "THE CODE" → first line "THE CODE:"
 *   lines     pre-broken lines (long lines may wrap on phones, never mid-word)
 *   trigger   "scroll"  (default) types once when `start` is reached
 *             "manual"  call ref.play() / ref.setProgress()
 *             "scrub"   typing progress follows scroll between scrub.start and scrub.end
 *   start     ScrollTrigger start for trigger="scroll" (default "top 85%")
 *   scrub     { trigger?, start?, end?, smooth? } for trigger="scrub"
 *             (defaults: this caption, "top 85%", "top 35%", true; smooth = ScrollTrigger scrub value)
 *   cps       characters per second (default 40; the edit runs ~35–45)
 *   dim       opacity a char appears at (default 0.35)
 *   brighten  seconds a char takes to reach full (default 0.2)
 *   lag       seconds a char stays dim before brightening (default 0.06)
 *   tone      "light" | "dark" (see above)
 *   glow      draw the bloom layers (tone="light"; default true)
 *   toneLock  keep `tone` even under <html data-theme="invert"> (by default every caption switches to the
 *             dark-on-light look there, see tokens.css)
 *   onComplete  fired when time-driven typing finishes
 *
 * Ref (TypeCaptionHandle)
 *   play()            start/resume typing (queued if called before mount)
 *   reset()           back to nothing typed
 *   hide()            200 ms cross-fade out (the edit's only exit); play()/setProgress() bring it back
 *   timeline()        the typing timeline (null under reduced motion / before mount)
 *   setProgress(0..1) jump to a typing progress, e.g. from a pinned step's own ScrollTrigger:
 *                     `onUpdate: (self) => cap.current?.setProgress(gsap.utils.mapRange(a, b, 0, 1, self.progress))`
 *   progress()        current typing progress 0..1
 *
 * Sound: each forward crossing of a whole character dispatches a window "dossier:tick" event (at most
 * one per update; jumps of more than 3 chars, e.g. setProgress/scrub leaps or resets, stay silent).
 * lib/audio.ts listens, throttles to ≤ 25/s and is silent until the visitor turns sound on.
 *
 * Reduced motion: fully shown, static (CSS forces --p). Screen readers get the whole text once.
 * `typeOn(elements, opts)` is still exported for animating arbitrary element lists the same way.
 */

import { useEffect, useImperativeHandle, useMemo, useRef, type CSSProperties, type ReactNode, type Ref } from "react";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";

export interface TypeOnOptions {
  /** characters per second (the edit runs ~35–45) */
  cps?: number;
  /** opacity a character appears at before it brightens */
  dim?: number;
  /** seconds each character takes to brighten to full */
  brighten?: number;
  /** seconds between a character appearing and starting to brighten */
  lag?: number;
}

/**
 * The same type-on for any list of elements (per-element tweens; TypeCaption itself uses the cheaper
 * CSS-variable path). Each element cuts in at `dim`, then brightens to full over `brighten`.
 */
export function typeOn(chars: Element[], { cps = 40, dim = 0.35, brighten = 0.2, lag = 0.06 }: TypeOnOptions = {}) {
  const step = 1 / cps;
  const tl = gsap.timeline();
  tl.set(chars, { opacity: 0 }, 0);
  tl.to(chars, { opacity: dim, duration: 0.001, ease: "none", stagger: step }, 0);
  tl.to(chars, { opacity: 1, duration: brighten, ease: "power1.out", stagger: step }, lag);
  return tl;
}

export interface TypeCaptionHandle {
  play: () => void;
  reset: () => void;
  hide: () => gsap.core.Tween | null;
  timeline: () => gsap.core.Timeline | null;
  setProgress: (progress: number) => void;
  progress: () => number;
}

export interface TypeCaptionScrub {
  /** element or selector the scrub range is measured on (default: the caption itself) */
  trigger?: string | Element | null;
  start?: string;
  end?: string;
  /** ScrollTrigger `scrub`: true, or seconds of smoothing */
  smooth?: boolean | number;
}

export interface TypeCaptionProps extends TypeOnOptions {
  label?: string;
  lines: readonly string[];
  trigger?: "scroll" | "manual" | "scrub";
  start?: string;
  scrub?: TypeCaptionScrub;
  tone?: "light" | "dark";
  glow?: boolean;
  toneLock?: boolean;
  className?: string;
  style?: CSSProperties;
  onComplete?: () => void;
  ref?: Ref<TypeCaptionHandle>;
}

type CharStyle = CSSProperties & { "--i": number };

/** window event lib/audio.ts turns into a type click */
const TICK_EVENT = "dossier:tick";

/** Lines → spans with a running char index (spaces count, which reads as a natural beat between words). */
function buildLines(lines: readonly string[]): { nodes: ReactNode; count: number } {
  let i = 0;
  const nodes = lines.map((line, l) => (
    <span key={l} className="tc-line">
      {Array.from(line).map((c, k) => (
        <span key={k} className="tc-ch" style={{ "--i": i++ } as CharStyle}>
          {c}
        </span>
      ))}
    </span>
  ));
  return { nodes, count: i };
}

export function TypeCaption({
  label,
  lines,
  trigger = "scroll",
  start = "top 85%",
  scrub,
  tone = "light",
  glow = true,
  toneLock = false,
  className = "",
  style,
  onComplete,
  ref,
  cps = 40,
  dim = 0.35,
  brighten = 0.2,
  lag = 0.06,
}: TypeCaptionProps) {
  const root = useRef<HTMLParagraphElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const pendingPlay = useRef(false);
  const pendingProgress = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  /** re-applies --p from the timeline's proxy (seeks with suppressed events skip onUpdate) */
  const syncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const linesKey = lines.join("\n");
  const allLines = useMemo(
    () => (label ? [`${label}:`, ...linesKey.split("\n")] : linesKey.split("\n")),
    [label, linesKey],
  );
  const { nodes, count } = useMemo(() => buildLines(allLines), [allLines]);

  // in chars; `total` is where the last char has fully brightened
  const lagChars = lag * cps;
  const rampChars = Math.max(0.5, brighten * cps);
  const total = count + lagChars + rampChars;

  const scrubTrigger = scrub?.trigger;
  const scrubStart = scrub?.start ?? "top 85%";
  const scrubEnd = scrub?.end ?? "top 35%";
  const scrubSmooth = scrub?.smooth ?? true;

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const proxy = { p: 0 };
        let typed = 0;
        const apply = () => {
          el.style.setProperty("--p", proxy.p.toFixed(2));
          const c = Math.floor(proxy.p);
          if (c > typed && c - typed <= 3 && c <= count) window.dispatchEvent(new Event(TICK_EVENT));
          typed = c;
        };
        apply();
        const tl = gsap.timeline({ paused: true });
        tl.to(proxy, { p: total, duration: total / cps, ease: "none", onUpdate: apply });
        tl.eventCallback("onComplete", () => onCompleteRef.current?.());
        tlRef.current = tl;
        syncRef.current = apply;

        let st: ScrollTrigger | null = null;
        if (trigger === "scroll") {
          st = ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => tl.play() });
        } else if (trigger === "scrub") {
          st = ScrollTrigger.create({
            trigger: scrubTrigger ?? el,
            start: scrubStart,
            end: scrubEnd,
            scrub: scrubSmooth,
            animation: tl,
          });
        }

        if (pendingProgress.current !== null) {
          tl.progress(pendingProgress.current).pause();
          apply();
        } else if (pendingPlay.current) tl.play();

        return () => {
          st?.kill();
          tl.kill();
          tlRef.current = null;
          syncRef.current = null;
          el.style.removeProperty("--p");
        };
      });
      return () => mm.revert();
    },
    {
      scope: root,
      dependencies: [trigger, start, total, count, cps, scrubTrigger, scrubStart, scrubEnd, scrubSmooth],
    },
  );

  useImperativeHandle(
    ref,
    () => {
      const show = () => {
        if (root.current) gsap.set(root.current, { opacity: 1 });
      };
      return {
        play: () => {
          pendingPlay.current = true;
          pendingProgress.current = null;
          show();
          tlRef.current?.play();
        },
        reset: () => {
          pendingPlay.current = false;
          pendingProgress.current = null;
          tlRef.current?.pause(0);
          syncRef.current?.();
          if (tlRef.current) show();
        },
        hide: () =>
          root.current ? gsap.to(root.current, { opacity: 0, duration: 0.2, ease: "power1.out", overwrite: true }) : null,
        timeline: () => tlRef.current,
        setProgress: (v: number) => {
          const p = gsap.utils.clamp(0, 1, v);
          pendingProgress.current = p;
          pendingPlay.current = false;
          const tl = tlRef.current;
          if (!tl) return;
          show();
          tl.pause();
          tl.progress(p);
          syncRef.current?.();
        },
        progress: () => tlRef.current?.progress() ?? pendingProgress.current ?? 1,
      };
    },
    [],
  );

  const light = tone !== "dark";
  const layers = light && glow ? (["tc-g3", "tc-g2", "tc-g1"] as const) : [];
  const vars = {
    "--tc-dim": dim,
    "--tc-lag": lagChars,
    "--tc-ramp": rampChars,
  } as CSSProperties;

  return (
    <p
      ref={root}
      className={`tc-root ${light ? "" : "tc-tone-dark"} ${className}`}
      style={{ ...vars, ...style }}
      {...(toneLock ? { "data-tone-lock": "" } : {})}
    >
      <span className="sr-only">{allLines.join(" ")}</span>
      {layers.map((cls) => (
        <span key={cls} className={`tc-layer tc-fx ${cls}`} aria-hidden>
          {nodes}
        </span>
      ))}
      <span className="tc-layer tc-core" aria-hidden>
        {nodes}
      </span>
    </p>
  );
}
