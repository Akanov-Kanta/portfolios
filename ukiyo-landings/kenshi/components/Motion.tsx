"use client";

import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Scroll choreography. Everything lives inside a reduced-motion media query:
 * with `prefers-reduced-motion: reduce` nothing is hidden or moved.
 */
export function Motion() {
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // hero: layered parallax — far layers lag behind the scroll, near ones keep up
      const hero = document.getElementById("top");
      if (hero) {
        hero.querySelectorAll<SVGElement>("[data-depth]").forEach((layer) => {
          const depth = Number(layer.dataset.depth ?? 0);
          gsap.to(layer, {
            yPercent: (1 - depth) * 26,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
          });
        });
      }

      // slash-wipe headings: a diagonal blade edge sweeps the text in
      gsap.utils.toArray<HTMLElement>("[data-reveal='slash']").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "polygon(0% 0%, 0% 0%, -25% 100%, -25% 100%)" },
          {
            clipPath: "polygon(0% 0%, 125% 0%, 100% 100%, -25% 100%)",
            duration: 0.7,
            ease: "power4.inOut",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          },
        );
      });

      // red rule lines cut across before the heading lands
      gsap.utils.toArray<HTMLElement>("[data-slash-line]").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.35, ease: "steps(4)", scrollTrigger: { trigger: el, start: "top 90%", once: true } },
        );
      });

      // blocks: diagonal cut-in with a short hard drop (no soft fades)
      ScrollTrigger.batch("[data-reveal='rise']", {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.fromTo(
            batch,
            { clipPath: "polygon(0% 0%, 0% 0%, -20% 100%, -20% 100%)", y: 36 },
            {
              clipPath: "polygon(0% 0%, 120% 0%, 100% 100%, -20% 100%)",
              y: 0,
              duration: 0.75,
              ease: "power4.out",
              stagger: 0.12,
              clearProps: "clipPath,transform",
            },
          ),
      });

      // the steel moon of "The Way" rises as the section scrolls
      const moon = document.querySelector("[data-depth-float]");
      if (moon) {
        gsap.fromTo(
          moon,
          { yPercent: 18 },
          {
            yPercent: -12,
            ease: "none",
            scrollTrigger: { trigger: "#way", start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      }

      // sensei discs: each sun slides up behind its silhouette
      gsap.utils.toArray<SVGCircleElement>(".portrait-disc").forEach((disc) => {
        gsap.fromTo(
          disc,
          { y: 70 },
          {
            y: -10,
            ease: "none",
            scrollTrigger: { trigger: disc.closest("article"), start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    });

    return () => mm.revert();
  }, []);

  return null;
}
