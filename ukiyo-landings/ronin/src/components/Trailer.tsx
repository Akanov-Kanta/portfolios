"use client";

import { useRef, useState } from "react";
import { Moon } from "./art/Moon";
import { Ronin } from "./art/Ronin";
import { Gozan } from "./art/Characters";

/** Styled placeholder trailer frame — no real video. */
export function Trailer() {
  const [armed, setArmed] = useState(false);
  const flashRef = useRef<HTMLDivElement>(null);

  const onPlay = () => {
    setArmed(true);
    const el = flashRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate([{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 140, easing: "steps(2, end)" });
  };

  return (
    <section id="trailer" className="cut-top relative overflow-x-clip bg-ink pb-28 md:pb-36">
      <span className="seam-glint" data-glint data-angle="-4" style={{ top: "calc(var(--cut) - 1px)", width: "101%" }} />
      <div className="mx-auto max-w-[1320px] px-[6vw] lg:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p data-cut className="label text-gold">Reveal trailer</p>
            <h2
              data-cut
              className="font-display mt-4 text-[clamp(2.4rem,5.4vw,4.6rem)] leading-[0.98] font-extrabold text-rice"
            >
              Two shadows. One bridge.
            </h2>
          </div>
          <p data-cut className="label text-rice/60">02:14 · Hand-inked in-engine footage</p>
        </div>

        <div data-cut className="relative mt-12">
          <p
            lang="ja"
            aria-hidden="true"
            className="vertical font-display absolute -left-[4.2vw] top-0 hidden text-[1.2rem] font-extrabold tracking-[0.4em] text-vermilion lg:block"
          >
            予告編
          </p>
          <div
            className="relative aspect-video w-full overflow-hidden border-[3px] border-rice bg-crimson"
            style={{ boxShadow: "14px 14px 0 var(--vermilion)" }}
          >
            {/* scene */}
            <Moon className="absolute left-1/2 top-[8%] w-[46%] -translate-x-1/2" />
            <svg viewBox="0 0 1600 900" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
              {/* far hills */}
              <path d="M0 640l140-60 120 30 160-90 140 70 200-40 180 60 160-50 200 70 140-30 160 40V900H0z" fill="var(--crimson-deep)" />
              {/* water */}
              <rect x="0" y="720" width="1600" height="180" fill="var(--ink-2)" />
              <g stroke="var(--steel)" strokeWidth="3">
                <path d="M120 770h140M420 800h220M900 780h160M1220 810h200M300 850h120M1000 860h260" />
              </g>
              {/* moon reflection */}
              <g fill="var(--moon)">
                <rect x="700" y="736" width="200" height="6" />
                <rect x="730" y="756" width="140" height="6" />
                <rect x="760" y="776" width="80" height="5" />
              </g>
              {/* taiko bridge */}
              <path d="M180 690Q800 470 1420 690v22Q800 500 180 712z" fill="var(--ink)" />
              <path d="M240 680v70M400 630v120M560 595v150M720 578v170M880 578v170M1040 595v150M1200 630v120M1360 680v70" stroke="var(--ink)" strokeWidth="14" />
              <path d="M180 652Q800 432 1420 652" fill="none" stroke="var(--ink)" strokeWidth="10" />
              {[300, 460, 620, 780, 940, 1100, 1260].map((x) => (
                <rect key={x} x={x} y={652 - 110 * (1 - Math.pow((x - 800) / 620, 2)) - 4} width="10" height="44" fill="var(--ink)" />
              ))}
            </svg>
            <div className="absolute bottom-[38%] left-[24%] h-[34%]">
              <Ronin className="h-full w-auto" />
            </div>
            <div className="absolute bottom-[38%] right-[22%] h-[36%] -scale-x-100">
              <Gozan className="h-full w-auto" />
            </div>
            {/* letterbox bars */}
            <div className="absolute inset-x-0 top-0 h-[9%] bg-ink" />
            <div className="absolute inset-x-0 bottom-0 flex h-[9%] items-center justify-between bg-ink px-4">
              <span className="label text-[0.6rem] text-rice/70 md:text-[0.72rem]">RŌNIN — Reveal</span>
              <span className="label text-[0.6rem] text-rice/70 md:text-[0.72rem]">00:00 / 02:14</span>
            </div>

            {/* play */}
            <div className="absolute inset-0 flex items-center justify-center">
              {armed ? (
                <div className="mx-6 max-w-[26rem] border-[3px] border-ink bg-rice p-5 text-center text-ink md:p-7" style={{ boxShadow: "8px 8px 0 var(--ink)" }} role="status">
                  <p className="label text-crimson">Premieres soon</p>
                  <p className="font-display mt-2 text-xl leading-snug font-extrabold md:text-2xl">
                    The blade is still in its sheath.
                  </p>
                  <p className="mt-2 text-[0.95rem] leading-snug text-ink-2">
                    The reveal trailer premieres 12 · 12 · 2026. Wishlist to be there when it is drawn.
                  </p>
                </div>
              ) : (
                <span className="btn-wrap">
                  <button
                    type="button"
                    onClick={onPlay}
                    className="btn btn-blade !px-4 !py-3 sm:!px-6 sm:!py-5 md:!px-8 md:!py-6"
                    aria-label="Play reveal trailer"
                  >
                    <svg viewBox="0 0 12 14" className="h-5 w-[18px] md:h-[30px] md:w-[26px]" aria-hidden="true">
                      <path d="M0 0l12 7-12 7z" fill="currentColor" />
                    </svg>
                    <span className="hidden sm:inline">Play</span>
                  </button>
                </span>
              )}
            </div>
            {/* corner brackets */}
            {["left-3 top-[11%] border-l-[3px] border-t-[3px]", "right-3 top-[11%] border-r-[3px] border-t-[3px]", "bottom-[11%] left-3 border-b-[3px] border-l-[3px]", "bottom-[11%] right-3 border-b-[3px] border-r-[3px]"].map((c) => (
              <span key={c} className={`absolute h-6 w-6 border-rice ${c}`} />
            ))}
            <div ref={flashRef} className="pointer-events-none absolute inset-0 bg-rice opacity-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
