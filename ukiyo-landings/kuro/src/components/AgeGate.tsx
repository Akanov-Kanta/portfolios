"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { Hanko } from "./art/Scenery";

const KEY = "kuro:age";

export default function AgeGate() {
  const gate = useRef<HTMLDivElement>(null);
  const slash = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const yes = useRef<HTMLButtonElement>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (document.documentElement.getAttribute("data-age") !== "ok") {
      yes.current?.focus({ preventScroll: true });
    }
  }, []);

  const enter = () => {
    try {
      sessionStorage.setItem(KEY, "ok");
    } catch {
      /* storage unavailable: gate simply returns next visit */
    }
    const root = document.documentElement;
    const done = () => {
      root.setAttribute("data-age", "ok");
      window.dispatchEvent(new Event("kuro:enter"));
      document.getElementById("top")?.focus({ preventScroll: true });
    };
    if (!root.classList.contains("motion") || !gate.current) {
      done();
      return;
    }
    // the cut: a gold slash, one red flash frame, then the gate is wiped away on the diagonal
    const tl = gsap.timeline({ onComplete: done });
    tl.fromTo(
      slash.current,
      { clipPath: "polygon(0% 100%, 0% 100%, 0% 100%, 0% 100%)", autoAlpha: 1 },
      { clipPath: "polygon(0% 100%, 100% 0%, 100% 0.6%, 0.4% 100%)", duration: 0.22, ease: "power4.in" },
    )
      .set(flash.current, { autoAlpha: 1 })
      .set(flash.current, { autoAlpha: 0 }, "+=0.08")
      .set(slash.current, { autoAlpha: 0 })
      .fromTo(
        gate.current,
        { clipPath: "polygon(-40% 0%, 100% 0%, 100% 100%, -40% 100%)" },
        { clipPath: "polygon(140% 0%, 140% 0%, 100% 100%, 100% 100%)", duration: 0.75, ease: "expo.inOut" },
      );
  };

  return (
    <div
      ref={gate}
      className="age-gate fixed inset-0 z-[100] overflow-hidden bg-ink text-rice"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-title"
    >
      {/* the half-risen gold moon */}
      <div
        aria-hidden
        className="gold-leaf absolute left-1/2 top-[66%] aspect-square w-[150vw] -translate-x-1/2 rounded-full sm:w-[min(96vh,110vw)]"
      />
            <div aria-hidden className="absolute inset-x-0 bottom-0 top-[82%] bg-ink" />
      <div aria-hidden className="absolute inset-x-0 top-[82%] h-[2px] bg-gold" />

      <div className="relative mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 pb-[26vh] text-center">
        <Hanko className="mb-8 h-12 w-12" chars={["黒"]} />
        <p className="label text-gold">KURO · The Night Series</p>
        <h2
          id="age-title"
          className="mt-5 font-display text-[clamp(2rem,6vw,3.6rem)] leading-[1.05] font-bold text-balance"
        >
          {denied ? "Then the moon will wait for you." : "Are you of legal drinking age?"}
        </h2>
        <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-rice/75">
          {denied
            ? "KURO is only for those of legal drinking age where they live. Come back when the time is right — the kura has been patient since 1789."
            : "This site is about sake. Please confirm you are of legal drinking age in your country. We remember your answer for this session only."}
        </p>
        {!denied && (
          <div className="mt-9 flex flex-wrap items-center justify-center gap-5">
            <button ref={yes} type="button" onClick={enter} className="btn btn-gold">
              <span>Yes, I am</span>
            </button>
            <button type="button" onClick={() => setDenied(true)} className="btn btn-ghost">
              <span>Not yet</span>
            </button>
          </div>
        )}
      </div>

      <p className="vertical absolute right-5 top-1/2 hidden -translate-y-1/2 font-display text-sm tracking-[0.5em] text-gold md:block">
        二十歳未満の飲酒は禁じられています
      </p>

      <div ref={slash} aria-hidden className="invisible absolute inset-0 bg-gold" />
      <div ref={flash} aria-hidden className="invisible fixed inset-0 bg-crimson" />
    </div>
  );
}
