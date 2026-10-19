"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ChefArt from "../art/ChefArt";
import Hanko from "../art/Hanko";
import { MOTION_OK } from "../motion/Motion";

export default function Chef() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: "[data-chef-art]", start: "top 70%", once: true } });
        tl.fromTo(
          "[data-chef-slash]",
          { clipPath: "inset(0% 0% 0% 100%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.45, ease: "power4.in" },
        )
          .set("[data-chef-flash]", { opacity: 1 })
          .set("[data-chef-flash]", { opacity: 0 }, "+=0.08")
          .from("[data-chef-drops] path", {
            x: -40,
            y: 30,
            scale: 0,
            transformOrigin: "50% 50%",
            duration: 0.5,
            ease: "power3.out",
            stagger: 0.025,
          }, "<");
        gsap.utils.toArray<SVGGElement>("[data-chef-art] [data-depth]").forEach((g) => {
          const d = Number(g.dataset.depth ?? 0.1);
          gsap.fromTo(
            g,
            { y: -300 * d },
            {
              y: 300 * d,
              ease: "none",
              scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="chef" className="relative overflow-clip bg-ink pt-24 md:pt-36">
      {/* crimson diagonal field */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-crimson"
        style={{ clipPath: "polygon(58% 0, 100% 0, 100% 100%, 30% 100%)" }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-steel" style={{ clipPath: "polygon(57.4% 0, 58% 0, 30% 100%, 29.4% 100%)" }} />

      <div className="relative mx-auto grid max-w-[1400px] items-end gap-12 px-4 md:px-8 lg:grid-cols-2 lg:gap-8">
        <div className="lg:pb-36">
          <p data-reveal="cut" className="label mb-5 flex items-center gap-3 text-gold">
            <span className="inline-block h-[3px] w-10 bg-gold" /> The chef · 料理長
          </p>
          <h2 data-glint className="glint-host font-display text-5xl font-extrabold leading-none text-rice md:text-7xl">
            <span data-reveal="slash" className="block">
              Kenji
            </span>
            <span data-reveal="slash" data-delay="0.08" className="block">
              Arakawa
            </span>
            <span className="glint-line" aria-hidden="true" />
          </h2>
          <p data-reveal="cut" className="mt-8 max-w-lg text-lg leading-relaxed text-rice/85">
            Twenty years of broth: a yatai cart in Sapporo, a basement counter in Ebisu, then the bridge. Kenji still
            flicks every basket of noodles himself — one hard snap, like a sword shaking off rain.
          </p>

          <figure data-reveal="slash" className="relative mt-10 max-w-lg border-l-[6px] border-vermilion bg-ink-2 p-6 shadow-[8px_8px_0_0_var(--vermilion)] md:p-8">
            <span aria-hidden="true" className="absolute -top-7 left-4 font-display text-7xl font-extrabold leading-none text-vermilion">
              “
            </span>
            <blockquote className="font-display text-2xl font-bold leading-snug text-rice md:text-3xl">
              Broth is patience. Noodles are timing. The rest is just staying awake.
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-4">
              <Hanko text="荒川" className="w-12" />
              <span className="label text-gold">Kenji Arakawa, head chef</span>
            </figcaption>
          </figure>
        </div>

        <div data-chef-art className="relative mx-auto w-full max-w-[560px]">
          <ChefArt className="block w-full" />
          <div data-chef-flash aria-hidden="true" className="pointer-events-none absolute inset-0 bg-rice opacity-0" />
          <p aria-hidden="true" className="vertical absolute -left-2 top-4 font-display text-2xl font-extrabold text-rice md:-left-10 md:text-3xl">
            二十年の湯気
          </p>
        </div>
      </div>
    </section>
  );
}
