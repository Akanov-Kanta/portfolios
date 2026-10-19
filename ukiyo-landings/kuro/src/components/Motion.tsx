"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

const HIDDEN = "polygon(0% 0%, 0% 0%, -40% 100%, -40% 100%)";
const SHOWN = "polygon(0% 0%, 140% 0%, 140% 100%, -40% 100%)";

/**
 * One registrar for every scroll / entrance effect on the page.
 * Sections stay server-rendered and opt in through data attributes:
 *   data-reveal          diagonal slash-wipe reveal
 *   data-rise            short rise + fade (for small UI copy)
 *   data-parallax="n"    layered parallax, n = speed (negative = up)
 *   data-draw            ink stroke draws on (inside [data-draw-group])
 *   data-screen-panel    folding-screen panels unfolding with scroll
 */
export default function Motion() {
  useGSAP(() => {
    const root = document.documentElement;
    if (!root.classList.contains("motion")) return;

    /* ---------- hero entrance, held until the age gate is passed ---------- */
    const intro = () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from("[data-hero-moon]", { yPercent: 14, duration: 2.4, ease: "power2.out" }, 0)
        .from("[data-hero-bottle]", { yPercent: 8, autoAlpha: 0, duration: 1.4 }, 0.25)
        .fromTo(
          "[data-hero-cut]",
          { clipPath: HIDDEN },
          { clipPath: SHOWN, duration: 1, stagger: 0.12, ease: "expo.inOut" },
          0.35,
        )
        .from("[data-hero-kasumi]", { xPercent: -12, autoAlpha: 0, duration: 2, stagger: 0.2, ease: "power2.out" }, 0.4)
        .from("[data-hero-pine]", { xPercent: 10, yPercent: -8, duration: 2.2, ease: "power3.out" }, 0.2)
        .fromTo("[data-hero-rise]", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08 }, 1);
    };
    if (root.getAttribute("data-age") === "ok") intro();
    else window.addEventListener("kuro:enter", intro, { once: true });

    /* ---------- blade glint along the hero bottle edge ---------- */
    gsap.utils.toArray<SVGPathElement>("[data-hero-bottle] [data-glint]").forEach((p) => {
      gsap.fromTo(
        p,
        { strokeDashoffset: 40 },
        { strokeDashoffset: -760, duration: 1.6, ease: "power2.inOut", repeat: -1, repeatDelay: 3.4, delay: 2 },
      );
    });

    /* ---------- slash reveals ---------- */
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: true,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { clipPath: HIDDEN },
          {
            clipPath: SHOWN,
            duration: 0.95,
            ease: "expo.inOut",
            stagger: 0.1,
            onComplete() {
              els.forEach((el) => {
                el.setAttribute("data-shown", "");
                gsap.set(el, { clearProps: "clipPath" });
              });
            },
          },
        ),
    });

    ScrollTrigger.batch("[data-rise]", {
      start: "top 92%",
      once: true,
      onEnter: (els) =>
        gsap.fromTo(els, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.07 }),
    });

    /* ---------- parallax layers ---------- */
    gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
      const speed = parseFloat(el.dataset.parallax || "0.2");
      const trigger = el.closest("section") ?? el;
      gsap.fromTo(
        el,
        { y: () => -speed * 120 },
        {
          y: () => speed * 120,
          ease: "none",
          scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
        },
      );
    });

    /* hero exits slowly: moon sinks less than the bottle — layered depth */
    gsap.to("[data-hero-depth]", {
      yPercent: 10,
      ease: "none",
      scrollTrigger: { trigger: "#top", start: "top top", end: "bottom top", scrub: true },
    });

    /* ---------- ink strokes drawing on ---------- */
    gsap.utils.toArray<HTMLElement>("[data-draw-group]").forEach((group) => {
      const paths = group.querySelectorAll("[data-draw]");
      if (!paths.length) return;
      gsap.fromTo(
        paths,
        { drawSVG: "0%" },
        {
          drawSVG: "100%",
          duration: 1.6,
          ease: "power2.inOut",
          stagger: 0.06,
          scrollTrigger: { trigger: group, start: "top 80%", once: true },
        },
      );
    });

    /* heritage timeline brush line scrubs with scroll */
    const brush = document.querySelector("[data-brush]");
    if (brush) {
      gsap.fromTo(
        brush,
        { drawSVG: "0%" },
        {
          drawSVG: "100%",
          ease: "none",
          scrollTrigger: { trigger: "[data-timeline]", start: "top 75%", end: "bottom 60%", scrub: 0.6 },
        },
      );
    }

    /* ---------- folding screen unfolds (desktop) ---------- */
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
      const panels = gsap.utils.toArray<HTMLElement>("[data-screen-panel]");
      if (!panels.length) return;
      // accordion: alternate panels turn ±θ about their centres and slide together so the
      // hinges stay joined — cos θ shrinks each panel's projected width
      const n = panels.length;
      const fold = (deg: number) => ({
        rotateY: (i: number) => (i % 2 ? -deg : deg),
        x: (i: number, el: HTMLElement) =>
          (i - (n - 1) / 2) * el.offsetWidth * (Math.cos((deg * Math.PI) / 180) - 1),
      });
      gsap.fromTo(
        panels,
        { ...fold(58) },
        {
          ...fold(9),
          ease: "power2.out",
          scrollTrigger: {
            trigger: "[data-screen]",
            start: "top 85%",
            end: "top 30%",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        },
      );
      gsap.fromTo(
        "[data-screen-fold]",
        { opacity: 0.45 },
        {
          opacity: 0.12,
          ease: "none",
          scrollTrigger: { trigger: "[data-screen]", start: "top 85%", end: "top 30%", scrub: 0.8 },
        },
      );
    });

    /* cranes cross the crimson sky */
    gsap.utils.toArray<HTMLElement>("[data-crane]").forEach((el, i) => {
      gsap.fromTo(
        el,
        { xPercent: -60 - i * 20, yPercent: 30 + i * 10 },
        {
          xPercent: 40 + i * 10,
          yPercent: -20,
          ease: "none",
          scrollTrigger: { trigger: el.closest("section") ?? el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      window.removeEventListener("kuro:enter", intro);
      mm.revert();
    };
  });

  return null;
}
