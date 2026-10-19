"use client";

/**
 * TypeCaption: the edit's small ALL-CAPS caption that types itself on (the site's only Quicksand).
 *
 * Look (tokens.css, `.tc-*`): Quicksand 500, `--caption-size`, caps. tone="light" (default) = #f0f0f0 on
 * dark grounds; tone="dark" = ink on paper.
 *
 * Motion: one CSS variable `--p` (characters typed, a float) drives every character. A char cuts in at
 * `dim` once `--p` passes it, holds dim for `lag` seconds' worth of chars, then brightens to full over
 * `brighten` seconds' worth. GSAP tweens or scrubs a single number: no per-char tweens.
 *
 * Glow budget (DIRECTION §2.3): only the line currently typing glows. Each char knows its line's last
 * index (`--le`); a char's bloom lights as it brightens and the whole line's bloom fades out over `fade`
 * seconds once its last char has brightened. Finished lines are flat.
 *
 * Props
 *   label?    "THE SUBJECT" → first line "THE SUBJECT:"
 *   lines     pre-broken lines (long lines may wrap on phones, never mid-word)
 *   trigger   "scroll" (default: types once when `start` is reached) | "manual" (ref.play / setProgress)
 *             | "scrub" (progress follows scroll between scrub.start and scrub.end)
 *   cps       characters per second (default 31.25 = 32 ms per character)
 *   dim       opacity a char appears at (default 0.35)
 *   brighten  seconds a char takes to reach full (default 0.16)
 *   lag       seconds a char stays dim before brightening (default 0.04)
 *   fade      seconds a finished line's glow takes to go out (default 0.4)
 *   delay     seconds before typing starts once triggered (default 0)
 *
 * Sound: each forward crossing of a whole character dispatches a window "dossier:tick" event, which
 * lib/audio.ts turns into a click (silent until the visitor turns sound on).
 * Reduced motion: fully shown, static, no glow. Screen readers get the whole text once.
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
  /** seconds a finished line's glow takes to fade out */
  fade?: number;
  /** seconds before typing starts once triggered */
  delay?: number;
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
  className?: string;
  style?: CSSProperties;
  onComplete?: () => void;
  ref?: Ref<TypeCaptionHandle>;
}

type CharStyle = CSSProperties & { "--i": number; "--le": number };

/** window event lib/audio.ts turns into a type click */
const TICK_EVENT = "dossier:tick";

/** Lines → spans with a running char index (spaces count, which reads as a natural beat between words). */
function buildLines(lines: readonly string[]): { nodes: ReactNode; count: number } {
  let i = 0;
  const nodes = lines.map((line, l) => {
    const chars = Array.from(line);
    const end = i + chars.length - 1;
    return (
      <span key={l} className="tc-line">
        {chars.map((c, k) => (
          <span key={k} className="tc-ch" style={{ "--i": i++, "--le": end } as CharStyle}>
            {c}
          </span>
        ))}
      </span>
    );
  });
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
  className = "",
  style,
  onComplete,
  ref,
  cps = 31.25,
  dim = 0.35,
  brighten = 0.16,
  lag = 0.04,
  fade = 0.4,
  delay = 0,
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
  const fadeChars = Math.max(0.5, fade * cps);
  const total = count + lagChars + rampChars + fadeChars;

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
        tl.to(proxy, { p: total, duration: total / cps, ease: "none", onUpdate: apply }, trigger === "scrub" ? 0 : delay);
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
      dependencies: [trigger, start, total, count, cps, delay, scrubTrigger, scrubStart, scrubEnd, scrubSmooth],
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
  const layers = light && glow ? (["tc-g2", "tc-g1"] as const) : [];
  const vars = {
    "--tc-dim": dim,
    "--tc-lag": lagChars,
    "--tc-ramp": rampChars,
    "--tc-fade": fadeChars,
  } as CSSProperties;

  return (
    <p
      ref={root}
      className={`tc-root ${light ? "" : "tc-tone-dark"} ${className}`}
      style={{ ...vars, ...style }}
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
