"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export const SLASH_FROM = "polygon(0% 0%, 0% 0%, -30% 100%, -30% 100%)";
export const SLASH_TO = "polygon(0% 0%, 130% 0%, 100% 100%, -30% 100%)";
export const REDUCED = "(prefers-reduced-motion: reduce)";
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/**
 * Page-wide scroll choreography driven by data attributes:
 *  - data-reveal="slash"  diagonal sword-cut wipe
 *  - data-reveal="cut"    hard bottom-up cut (no fade)
 *  - data-parallax="0.2"  vertical drift while in view
 *  - data-glint           blade glint across a heading (needs a .glint-line child)
 * Everything is gated behind prefers-reduced-motion: no-preference.
 */
export default function Motion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.utils.toArray<HTMLElement>("[data-reveal='slash']").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: SLASH_FROM },
          {
            clipPath: SLASH_TO,
            duration: 0.85,
            ease: "expo.inOut",
            delay: Number(el.dataset.delay ?? 0),
            clearProps: "clipPath",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal='cut']").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(0% 0% 100% 0%)", y: 36 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            y: 0,
            duration: 0.6,
            ease: "power4.out",
            delay: Number(el.dataset.delay ?? 0),
            clearProps: "clipPath,transform",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const speed = Number(el.dataset.parallax ?? 0.2);
        gsap.fromTo(
          el,
          { y: -120 * speed },
          {
            y: 120 * speed,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-glint]").forEach((el) => {
        const line = el.querySelector(".glint-line");
        if (!line) return;
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 80%", once: true }, delay: 0.5 })
          .set(line, { transformOrigin: "left center" })
          .to(line, { scaleX: 1, duration: 0.3, ease: "power4.in" })
          .set(line, { transformOrigin: "right center" })
          .to(line, { scaleX: 0, duration: 0.35, ease: "power3.out" });
      });
    });

    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  });

  return null;
}
