"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import OniMask from "../art/OniMask";
import { MOTION_OK, REDUCED, SLASH_FROM, SLASH_TO } from "../motion/Motion";

gsap.registerPlugin(useGSAP);

const TOP = "polygon(0% 0%, 100% 0%, 100% 38%, 0% 62%)";
const BOTTOM = "polygon(0% 62%, 100% 38%, 100% 100%, 0% 100%)";

function Card() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-ink">
      <OniMask className="intro-mark w-28 md:w-36" />
      <p className="font-display text-6xl font-extrabold tracking-[0.2em] text-rice md:text-7xl">ONI</p>
      <p className="label text-gold">Ramen · Izakaya · until 4 a.m.</p>
    </div>
  );
}

/**
 * Opening cut: the ink title card is sliced along a diagonal by a blade line,
 * a one-frame red flash, then the two halves slide apart to reveal the hero.
 * Without JS the card hides itself via CSS; with reduced motion it never shows.
 */
export default function Intro() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(REDUCED, () => {
        el.style.display = "none";
      });
      mm.add(MOTION_OK, () => {
        // If hydration was slow and the CSS fallback already hid the card, don't replay it.
        if (getComputedStyle(el).visibility === "hidden") {
          el.style.display = "none";
          return;
        }
        el.style.animation = "none";
        const heroIn = document.querySelectorAll("[data-hero-in]");
        gsap.set(heroIn, { clipPath: SLASH_FROM });
        const tl = gsap.timeline({
          onComplete: () => {
            el.style.display = "none";
          },
        });
        tl.from(".intro-mark", { scale: 0.8, rotate: -6, duration: 0.5, ease: "back.out(2.2)" })
          .to(".intro-blade", { strokeDashoffset: 0, duration: 0.26, ease: "power4.in" }, "+=0.2")
          .set(".intro-flash", { opacity: 1 })
          .set(".intro-flash", { opacity: 0 }, "+=0.08")
          .set(".intro-blade", { opacity: 0 })
          .to(".intro-top", { x: "-3vw", y: "0.8vh", duration: 0.22, ease: "power2.out" }, "<")
          .to(".intro-bottom", { x: "3vw", y: "-0.8vh", duration: 0.22, ease: "power2.out" }, "<")
          .to(".intro-top", { y: "-110vh", x: "-10vw", duration: 0.65, ease: "power4.in" })
          .to(".intro-bottom", { y: "110vh", x: "10vw", duration: 0.65, ease: "power4.in" }, "<")
          .to(
            heroIn,
            { clipPath: SLASH_TO, duration: 0.8, ease: "expo.inOut", stagger: 0.09, clearProps: "clipPath" },
            "-=0.3",
          );
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="intro-cover fixed inset-0 z-[100]" aria-hidden="true">
      <div className="intro-top absolute inset-0" style={{ clipPath: TOP }}>
        <Card />
      </div>
      <div className="intro-bottom absolute inset-0" style={{ clipPath: BOTTOM }}>
        <Card />
      </div>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line
          className="intro-blade"
          x1="-2"
          y1="62.5"
          x2="102"
          y2="37.5"
          stroke="var(--rice)"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset="1"
        />
      </svg>
      <div className="intro-flash pointer-events-none absolute inset-0 bg-vermilion opacity-0" />
    </div>
  );
}
