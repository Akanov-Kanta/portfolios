"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import HeroScene from "../art/HeroScene";
import Hanko from "../art/Hanko";
import { MOTION_OK } from "../motion/Motion";

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // layered parallax inside the SVG: far layers lag behind the scroll
        gsap.utils.toArray<SVGGElement>("[data-depth]").forEach((g) => {
          const depth = Number(g.dataset.depth ?? 0.5);
          gsap.to(g, {
            y: (1 - depth) * 280,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
          });
        });
        // the night train crosses the moon
        gsap.fromTo(
          "[data-train]",
          { x: -1500 },
          { x: 1750, duration: 15, ease: "none", repeat: -1, repeatDelay: 3, delay: 1.5 },
        );
        // copy block drifts slower than the page
        gsap.to("[data-hero-copy]", {
          y: 120,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="relative min-h-[640px] overflow-clip bg-crimson h-[100svh]">
      <div className="absolute inset-x-0 top-0 h-[60%] md:bottom-12 md:h-auto">
        <HeroScene className="h-full w-full" />
      </div>

      <div className="absolute inset-x-0 bottom-0 hidden h-12 bg-ink md:block" aria-hidden="true" />
      {/* mobile: ink ground with a steel-rimmed diagonal edge */}
      <div className="absolute inset-x-0 bottom-0 h-[46%] md:hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-steel" style={{ clipPath: "polygon(0 12%, 100% 0, 100% 100%, 0 100%)" }} />
        <div
          className="absolute inset-0 bg-ink"
          style={{ clipPath: "polygon(0 calc(12% + 4px), 100% 4px, 100% 100%, 0 100%)" }}
        />
      </div>

      {/* vertical side label */}
      <p
        data-hero-in
        className="vertical absolute left-4 top-24 hidden font-display text-xl font-bold text-rice md:left-8 md:top-28 md:block"
      >
        深夜拉麺と酒 · 鬼
      </p>

      <div
        data-hero-copy
        className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-4 pb-16 md:px-8 md:pb-14 md:pl-20"
      >
        <div data-hero-in className="mb-3 hidden items-center gap-3 md:flex">
          <Hanko text="鬼" className="w-9 md:w-11" />
          <p className="label text-gold">Under the Kōsen rail bridge · since 2019</p>
        </div>
        <h1 className="relative">
          <span className="sr-only">ONI — late-night ramen and izakaya</span>
          <span
            data-hero-in
            aria-hidden="true"
            className="block font-display font-extrabold leading-[0.78] tracking-[0.04em] text-rice hard-text text-[clamp(6rem,31vw,19rem)] md:text-[clamp(9rem,21vw,19rem)]"
          >
            ONI
          </span>
        </h1>
        <p
          data-hero-in
          className="mt-3 max-w-md font-display text-lg font-bold leading-snug text-rice md:mt-6 md:text-3xl"
        >
          Ramen, small plates and cold sake —{" "}
          <span className="bg-vermilion px-1 text-ink">until four in the morning.</span>
        </p>
        <div data-hero-in className="mt-5 flex flex-wrap gap-3 md:mt-8 md:gap-4">
          <a href="#reserve" className="btn btn-red max-md:!px-4 max-md:!py-3">
            Reserve a seat
          </a>
          <a href="#menu" className="btn btn-ink max-md:!px-4 max-md:!py-3">
            See the menu
          </a>
        </div>
      </div>

      <a
        href="#menu"
        className="absolute bottom-8 right-6 hidden items-center gap-3 text-rice md:flex"
        aria-label="Scroll to the menu"
      >
        <span className="label">Scroll</span>
        <span className="block h-16 w-[3px] bg-rice" />
      </a>
    </section>
  );
}
