"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { Eye } from "@/components/art/Eye";
import { InkBurst } from "@/components/art/InkBurst";
import { burstObjectURL } from "@/components/art/ink-burst";
import { PhotoPlaceholder } from "@/components/art/PhotoPlaceholder";
import { Strip } from "@/components/art/Strip";
import { stripGlitch } from "@/components/art/strip-fx";
import { flash } from "@/components/fx/flash";
import { TypeCaption, type TypeCaptionHandle } from "@/components/fx/TypeCaption";
import { sfx } from "@/lib/audio";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { BURST, GIANT_EYE_SEED } from "./stage";

/** Pinned length (viewport heights) and the phase boundaries inside it. */
const PIN = 3;
const FLIP = 0.3; // A → B: hard black/white inversion
const LATE = 0.55; // B → C: t_10.00 layout
const CAP_RANGES: [number, number][] = [
  [0.58, 0.72],
  [0.74, 0.88],
];

type Phase = "question" | "window" | "late";

const setTheme = (inverted: boolean) => {
  const root = document.documentElement;
  if (inverted) root.dataset.theme = "invert";
  else if (root.dataset.theme === "invert") delete root.dataset.theme;
};

/**
 * Chapter 5 — INVERT.
 *   A (d_7.60)  black ground, the white burst, the centre word flipping ENGINEER? / ARTIST? every
 *               250–330 ms (the old word cuts out, the new one blurs/scales in over 120 ms).
 *   B (d_8.60)  hard flip on a 1–3 frame flash: paper ground, the burst turns black and becomes a
 *               window onto the photo slot (mask-image from the same burst bitmap); it grows with scroll.
 *   C (t_10.00) same grammar inverted: giant spiral eye, strip in the left zone, dark captions typing
 *               top-left then bottom-right with scroll.
 * While B/C are on screen <html data-theme="invert"> is set so the post layer can react. The wrapper
 * overlaps the Dossier's last pinned frame (motion only), so the chapter starts on a hard cut.
 * Reduced motion: no pin/flash/flicker; the question (both words) then the inverted captions, static.
 */
export function Invert() {
  const root = useRef<HTMLElement>(null);
  const caps = useRef<(TypeCaptionHandle | null)[]>([]);
  const [maskUrl, setMaskUrl] = useState<string | null>(null);

  // the burst bitmap as a mask for the photo window (generated once, cached with the burst itself)
  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    burstObjectURL(BURST)
      .then((u) => {
        url = u;
        if (alive) setMaskUrl(u);
        else URL.revokeObjectURL(u);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        const words = q<HTMLElement>("[data-word] > span");
        const inv = q("[data-inv]")[0];
        const windowGroup = q("[data-phase-b]")[0];
        const lateGroup = q("[data-phase-c]")[0];
        const windowEl = q("[data-window]")[0];
        const giant = q("[data-giant]")[0];
        const strip = q("[data-strip]")[0];
        const capEls = q("[data-cap]");

        gsap.set(el, { autoAlpha: 0 });
        gsap.set([inv, windowGroup, lateGroup, ...capEls], { autoAlpha: 0 });
        gsap.set(words, { autoAlpha: 0 });

        // ---- A: the flipping word
        let w = 0;
        let flipCall: gsap.core.Tween | null = null;
        const showWord = (i: number) => {
          gsap.set(words, { autoAlpha: 0 });
          gsap.fromTo(
            words[i],
            { autoAlpha: 0, filter: "blur(6px)", scale: 1.06, x: gsap.utils.random(-2, 2) },
            { autoAlpha: 0.85, filter: "blur(0.6px)", scale: 1, x: 0, duration: 0.12, ease: "power2.out", overwrite: true },
          );
        };
        const loop = () => {
          w = (w + 1) % words.length;
          showWord(w);
          flipCall = gsap.delayedCall(gsap.utils.random(0.25, 0.33), loop);
        };
        const startFlip = () => {
          if (flipCall) return;
          showWord(w);
          flipCall = gsap.delayedCall(gsap.utils.random(0.25, 0.33), loop);
        };
        const stopFlip = () => {
          flipCall?.kill();
          flipCall = null;
        };

        // ---- phases: hard sets only
        let phase: Phase | null = null;
        const enter = (next: Phase) => {
          const prev = phase;
          phase = next;
          if (next === "question") {
            gsap.set(inv, { autoAlpha: 0 });
            setTheme(false);
            startFlip();
            return;
          }
          stopFlip();
          gsap.set(words, { autoAlpha: 0 });
          gsap.set(inv, { autoAlpha: 1 });
          setTheme(true);
          if (next === "window") {
            gsap.set(windowGroup, { autoAlpha: 1 });
            gsap.set([lateGroup, ...capEls], { autoAlpha: 0 });
            if (prev === "question") {
              flash({ hold: 0.05, fade: 0.02 });
              sfx.sweep();
            }
          } else {
            gsap.set(windowGroup, { autoAlpha: 0 });
            gsap.set([lateGroup, strip], { autoAlpha: 1 });
            if (prev === "window") {
              gsap.fromTo(
                giant,
                { scale: 1.6, filter: "blur(10px)" },
                { scale: 1, filter: "blur(0px)", duration: 0.25, ease: "power3.out" },
              );
              stripGlitch(strip);
              sfx.hit(0.5);
            }
          }
        };

        // visible from this pin's start (it overlaps the Dossier's last frame)
        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: "max",
          onToggle: (self) => gsap.set(el, { autoAlpha: self.isActive ? 1 : 0 }),
        });

        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: `+=${PIN * 100}%`,
          pin: true,
          onUpdate: (self) => {
            const p = self.progress;
            const next: Phase = p < FLIP ? "question" : p < LATE ? "window" : "late";
            if (next !== phase) enter(next);
            if (next === "window") {
              gsap.set(windowEl, { scale: 1 + 0.12 * ((p - FLIP) / (LATE - FLIP)) });
            }
            if (next === "late") {
              CAP_RANGES.forEach(([a, b], i) => {
                const v = gsap.utils.clamp(0, 1, (p - a) / (b - a));
                gsap.set(capEls[i], { autoAlpha: p >= a ? 1 : 0 });
                caps.current[i]?.setProgress(v);
              });
            }
          },
          onToggle: (self) => {
            if (!self.isActive) {
              stopFlip();
              setTheme(false);
            } else if (phase && phase !== "question") setTheme(true);
            else if (phase === "question") startFlip();
          },
          onLeaveBack: () => {
            phase = null;
          },
        });

        return () => {
          stopFlip();
          setTheme(false);
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const maskStyle: React.CSSProperties = maskUrl
    ? { maskImage: `url(${maskUrl})`, WebkitMaskImage: `url(${maskUrl})` }
    : { visibility: "hidden" };

  return (
    <div className="ch56-overlap relative" style={{ zIndex: 2 }}>
      <section
        id="invert"
        ref={root}
        aria-label="Engineer or artist"
        className="relative w-full motion-safe:h-svh motion-safe:overflow-hidden"
        style={{ background: "var(--ink-0)" }}
      >
        {/* A: the question on the white burst */}
        <div className="absolute inset-0 overflow-hidden motion-reduce:relative motion-reduce:h-svh">
          <div className="ch56-burst-c">
            <InkBurst {...BURST} className="block h-full w-full" />
          </div>
          <p data-word className="ch56-word" aria-label={site.invert.join(" ")}>
            {site.invert.map((word) => (
              <span key={word} aria-hidden>
                {word}
              </span>
            ))}
          </p>
        </div>

        {/* B + C: the inverted chapter on paper */}
        <div
          data-inv
          className="ch34-pre absolute inset-0 overflow-hidden motion-reduce:relative motion-reduce:px-[var(--gutter)] motion-reduce:py-[12vh]"
          style={{ background: "var(--paper-0)" }}
        >
          <div data-phase-b className="ch34-pre absolute inset-0 motion-reduce:hidden">
            <div className="ch56-burst-c">
              <InkBurst {...BURST} className="block h-full w-full" style={{ filter: "invert(1) blur(0.6px)" }} />
            </div>
            <div data-window className="ch56-burst-c ch56-window overflow-hidden" style={maskStyle}>
              {/* a portrait-shaped photo slot in the middle of the burst, like the figure in d_8.60 */}
              <div className="absolute" style={{ left: "32%", width: "36%", top: "18%", height: "82%" }}>
                <PhotoPlaceholder variant={6} />
              </div>
            </div>
          </div>

          <div data-phase-c className="ch34-pre absolute inset-0 motion-reduce:relative motion-reduce:inset-auto motion-reduce:visible">
            <div className="ch56-burst-l motion-reduce:hidden">
              <InkBurst {...BURST} className="block h-full w-full" style={{ filter: "invert(1) blur(0.6px)" }} />
            </div>
            <div data-giant className="ch56-giant pointer-events-none motion-reduce:hidden">
              <Eye seed={GIANT_EYE_SEED + 1} glow={false} className="block h-auto w-full" />
            </div>
            {site.invertCaptions.map((c, i) => (
              <div key={c.label} data-cap className={`${i === 0 ? "cap-slot-tl" : "cap-slot-br"} motion-reduce:mb-6`}>
                <TypeCaption
                  ref={(h) => {
                    caps.current[i] = h;
                  }}
                  trigger="manual"
                  tone="dark"
                  label={c.label}
                  lines={c.lines}
                />
              </div>
            ))}
            <Strip zone="l" className="ch34-pre" data={{ "data-strip": "" }}>
              <PhotoPlaceholder variant={7} />
            </Strip>
          </div>
        </div>
      </section>
    </div>
  );
}
