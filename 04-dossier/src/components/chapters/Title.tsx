"use client";

import { useId, useRef } from "react";
import { site } from "@/content/site";
import { TypeCaption, type TypeCaptionHandle } from "@/components/fx/TypeCaption";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";

const NAME = site.name.toUpperCase().split(" ");
const STREAKS = 28;
const JITTER_STEP = 1 / 14; // s: jitter is stepped, never smooth
/** entry smear: the name arrives horizontally motion-blurred (x-only stdDeviation) and sharpens */
const SMEAR_IN = 18;

/**
 * Chapter 2 — TITLE. Overlaps the end of the intro's pin (`.title-overlap`): streaks start while the eyes
 * defocus, then "NAZAR AKANOV" pops in glyph by glyph (~60 ms each) out of a horizontal smear and keeps
 * jittering in hard steps while light streaks (hairlines and soft bands, after d_2.40.jpg) shoot across
 * in bursts on the beat; then "SOFTWARE ENGINEER" types on. Pinned briefly; on the way out the name
 * smears sideways again and fades.
 */
export function Title() {
  const root = useRef<HTMLElement>(null);
  const caption = useRef<TypeCaptionHandle>(null);
  const smearId = `smear-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      const mm = gsap.matchMedia();

      mm.add(MQ.motion, () => {
        const chars = q<HTMLElement>(".title-char");
        const jits = q<HTMLElement>("[data-jit]");
        const streaks = q<HTMLElement>("[data-streak]");
        const name = q<HTMLElement>("[data-name]")[0];
        const blurNode = q<SVGFEGaussianBlurElement>("feGaussianBlur")[0];

        // ---- stepped jitter: per-char offsets + opacity flicker, only for glyphs already shown
        const state = { amp: 0, shown: 0, active: false };
        let acc = 0;
        const jitter = (_t: number, dt: number) => {
          if (!state.active) return;
          acc += dt / 1000;
          if (acc < JITTER_STEP) return;
          acc = 0;
          const a = state.amp;
          for (let i = 0; i < jits.length; i++) {
            if (i >= state.shown) continue;
            const flick = Math.random();
            gsap.set(jits[i], {
              x: (Math.random() * 2 - 1) * 3 * a,
              y: (Math.random() * 2 - 1) * 3 * a,
              rotation: (Math.random() * 2 - 1) * 4 * a,
              opacity: flick < 0.05 + 0.1 * a ? 0.35 : flick < 0.2 ? 0.8 : 1,
            });
          }
        };
        gsap.ticker.add(jitter);

        // ---- streaks (d_2.40): 3–6 px soft lines at 960 px wide (scaled to the viewport) plus the odd wide
        // blurred band, tapered at both ends, crossing the frame in ~0.2–0.35 s. Fired in bursts on the
        // beat (--bpm), a stray one on some off-beats.
        let streakCall: gsap.core.Tween | null = null;
        const shoot = (band = Math.random() < 0.18) => {
          const s = streaks.find((n) => !gsap.isTweening(n));
          if (!s) return;
          const vw = window.innerWidth;
          const k = Math.min(1.6, Math.max(0.55, vw / 960));
          const w = gsap.utils.random(0.25, 0.75) * vw;
          const h = (band ? gsap.utils.random(12, 20) : gsap.utils.random([3, 3, 4, 4, 5, 6])) * k;
          const ltr = Math.random() < 0.8;
          gsap.set(s, {
            width: w,
            height: h,
            top: `${gsap.utils.random(5, 95)}%`,
            rotation: gsap.utils.random(-1.2, 1.2),
            scaleX: ltr ? 1 : -1,
            opacity: band ? gsap.utils.random(0.25, 0.4) : gsap.utils.random(0.55, 0.9),
            filter: band ? `blur(${(4 * k).toFixed(1)}px)` : "none",
            boxShadow: band ? "none" : `0 0 ${(h * 1.6).toFixed(1)}px rgba(240,240,240,0.35)`,
          });
          gsap.fromTo(
            s,
            { x: ltr ? -w : vw },
            { x: ltr ? vw : -w, duration: gsap.utils.random(0.18, 0.34), ease: "power1.in" },
          );
        };
        const bpm = Number(getComputedStyle(document.documentElement).getPropertyValue("--bpm")) || 104;
        const beat = 60 / bpm;
        let beatN = 0;
        const loop = () => {
          if (beatN % 2 === 0) {
            const n = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < n; i++) gsap.delayedCall(i * 0.03, () => shoot());
          } else if (Math.random() < 0.55) {
            shoot(false);
          }
          beatN++;
          streakCall = gsap.delayedCall(beat / 2, loop);
        };
        const startStreaks = () => {
          if (streakCall) return;
          for (let i = 0; i < 6; i++) gsap.delayedCall(i * 0.035, () => shoot(i === 2));
          beatN = 0;
          streakCall = gsap.delayedCall(beat / 2, loop);
        };
        const stopStreaks = () => {
          streakCall?.kill();
          streakCall = null;
        };

        // ---- smear (x-only gaussian blur on the name), shared by the entry and the exit
        const smear = { v: 0 };
        const applySmear = () => {
          blurNode.setAttribute("stdDeviation", `${smear.v.toFixed(2)} 0`);
          name.style.filter = smear.v > 0.05 ? `url(#${smearId})` : "";
        };

        // ---- entrance (time-based): fires as the title reaches the top, i.e. as the intro's defocus ends
        const enter = gsap.timeline({ paused: true });
        enter.set(state, { amp: 1 }, 0);
        enter.fromTo(smear, { v: SMEAR_IN }, { v: 0, duration: chars.length * 0.06 + 0.3, ease: "power2.out", onUpdate: applySmear }, 0);
        enter.fromTo(name, { xPercent: -4 }, { xPercent: 0, duration: chars.length * 0.06 + 0.3, ease: "power3.out" }, 0);
        chars.forEach((c, i) => {
          enter.set(c, { opacity: 1 }, i * 0.06);
          enter.set(state, { shown: i + 1 }, i * 0.06);
        });
        const landed = chars.length * 0.06;
        enter.to(state, { amp: 0.45, duration: 0.9, ease: "power2.out" }, landed);
        enter.call(() => caption.current?.play(), [], landed + 0.25);

        ScrollTrigger.create({
          trigger: el,
          start: "top 4%",
          onEnter: () => enter.restart(),
          onLeaveBack: () => {
            enter.pause(0);
            state.shown = 0;
            gsap.set(chars, { opacity: 0 });
            smear.v = 0;
            applySmear();
            caption.current?.reset();
          },
        });
        ScrollTrigger.create({
          trigger: el,
          start: "top 22%", // the title overlaps the intro's pin: streaks begin during the eyes' defocus
          end: "bottom top",
          onToggle: (self) => {
            state.active = self.isActive;
            if (self.isActive) startStreaks();
            else stopStreaks();
          },
        });

        // ---- pinned hold, then the smear-out (scrubbed)
        gsap
          .timeline({
            scrollTrigger: { trigger: el, start: "top top", end: "+=90%", pin: true, scrub: true },
          })
          .to({}, { duration: 0.45 })
          .fromTo(smear, { v: 0 }, { v: 22, duration: 0.55, ease: "power2.in", onUpdate: applySmear, immediateRender: false }, 0.45)
          .to(name, { xPercent: 6, opacity: 0, duration: 0.55, ease: "power2.in" }, 0.45)
          .to(q("[data-caption-wrap]"), { opacity: 0, duration: 0.25, ease: "power1.in" }, 0.6);

        return () => {
          gsap.ticker.remove(jitter);
          stopStreaks();
          name.style.filter = "";
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      id="title"
      ref={root}
      aria-label="Title"
      className="title-overlap relative h-svh w-full overflow-hidden"
    >
      <svg aria-hidden width="0" height="0" className="pointer-events-none absolute" focusable="false">
        <filter id={smearId} x="-25%" y="-10%" width="150%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0 0" />
        </filter>
      </svg>

      {/* streaks: soft lines tapered at both ends (border-radius), brightest past the middle */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: STREAKS }, (_, i) => (
          <span
            key={i}
            data-streak
            className="absolute left-0 top-0 block origin-center opacity-0"
            style={{
              borderRadius: "50%",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(240,240,240,0.45) 22%, rgba(240,240,240,0.95) 68%, rgba(240,240,240,0.6) 88%, transparent 100%)",
            }}
          />
        ))}
      </div>

      <div className="relative flex h-full flex-col items-center justify-center px-[var(--gutter)] pt-[6vh]">
        <h1
          data-name
          aria-label={site.name}
          className="flex flex-wrap justify-center text-center leading-[0.95]"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--title-size)",
            fontWeight: "var(--title-weight)",
            letterSpacing: "var(--title-tracking)",
            color: "var(--paper-0)",
            textShadow: "var(--title-shadow)",
            columnGap: "0.32em",
          }}
        >
          {NAME.map((word, w) => (
            <span key={w} aria-hidden className="inline-block whitespace-nowrap">
              {word.split("").map((ch, i) => (
                <span key={i} className="title-char inline-block">
                  <span data-jit className="inline-block will-change-transform">
                    {ch}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </h1>
        <div data-caption-wrap className="mt-[3.2vh]">
          <TypeCaption
            ref={caption}
            trigger="manual"
            lines={[site.role.toUpperCase()]}
            className="text-center"
            style={{ letterSpacing: "0.32em" }}
          />
        </div>
      </div>
    </section>
  );
}
