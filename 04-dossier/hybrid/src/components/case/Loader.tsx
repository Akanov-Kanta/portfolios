"use client";

import { useEffect, useRef } from "react";
import { site } from "@/content/site";
import { HERO_LOOP } from "@/content/footage";
import { TypeCaption, type TypeCaptionHandle } from "@/components/fx/TypeCaption";
import { footage } from "@/lib/footage";
import { markHit, SEEN_KEY } from "@/lib/intro";
import { sfx } from "@/lib/audio";

/** counter reaches 100 no sooner than this (s), and no later than MAX even if the footage is still loading */
const MIN = 1.1;
const MAX = 2.2;
const HOLD = 0.12; // s at 100 before the cut

/**
 * 00 COLD OPEN. Pure black; the hero's footage chunk downloads underneath. A 000→100 counter in the
 * display face sits exactly where the name will be (same box as .hero-name), the caption types
 * "SUBJECT: NAZAR AKANOV" at 32 ms/char. At 100: one 50 ms white frame and a hard cut (0 ms) to the
 * hero, where the name replaces the counter in the same place. ~1.3 s on a normal connection.
 * Skipped (never shown) on repeat visits, deep links and reduced motion (see lib/intro.ts).
 */
export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const cap = useRef<TypeCaptionHandle>(null);

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.intro !== "run") {
      markHit();
      return;
    }
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    let ready = false;
    let raf = 0;
    let cutTimer = 0;
    let flashTimer = 0;
    const t0 = performance.now();
    void footage
      .ensureRange(HERO_LOOP.from, HERO_LOOP.to)
      .catch(() => {})
      .finally(() => {
        ready = true;
      });
    const capTimer = window.setTimeout(() => cap.current?.play(), 150);

    const cut = () => {
      const flash = document.getElementById("cf-flash");
      if (flash) flash.style.opacity = "1";
      if (root.current) root.current.style.display = "none";
      html.dataset.intro = "done";
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {}
      sfx.hit(0.8);
      markHit();
      flashTimer = window.setTimeout(() => {
        if (flash) flash.style.opacity = "0";
      }, 50);
    };

    const step = () => {
      const t = (performance.now() - t0) / 1000;
      let p = Math.min(1, t / MIN);
      p = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // power2.inOut
      if (!ready && t < MAX) p = Math.min(p, 0.9 + (0.09 * Math.max(0, t - MIN)) / (MAX - MIN));
      const n = Math.floor(p * 100);
      if (count.current) count.current.textContent = String(n).padStart(3, "0");
      if (n >= 100) {
        cutTimer = window.setTimeout(cut, HOLD * 1000);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(capTimer);
      window.clearTimeout(cutTimer);
      window.clearTimeout(flashTimer);
    };
  }, []);

  return (
    <div ref={root} className="loader" aria-hidden>
      <div className="grid loader-top mono">
        <span className="col-span-2 md:col-span-3">Case file Nº 001</span>
        <span className="col-span-2 md:col-span-3 max-md:text-right">Opening</span>
        <span className="max-md:hidden md:col-start-10 md:col-span-3 text-right">
          {site.location.lat} {site.location.lng}
        </span>
      </div>
      <div className="grid loader-cap">
        <TypeCaption ref={cap} trigger="manual" lines={[site.coldOpen]} className="col-span-4" />
      </div>
      <p className="hero-name display">
        <span ref={count}>000</span>
      </p>
    </div>
  );
}
