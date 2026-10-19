"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CLOSED = "polygon(0% 0%, 0% 0%, -30% 100%, -30% 100%)";
const OPEN = "polygon(0% 0%, 130% 0%, 100% 100%, -30% 100%)";

/**
 * Runs every scroll/intro effect on the page. Everything lives inside a
 * prefers-reduced-motion: no-preference media query, so reduced-motion users
 * (and no-JS visitors) get the fully static, fully visible page.
 */
export function MotionDirector() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const html = document.documentElement;
      html.classList.add("motion");

      /* ---------- intro: flash frame, then hard diagonal cuts ---------- */
      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      intro
        .set(".flash-frame", { opacity: 1, background: "var(--rice)" })
        .set(".flash-frame", { opacity: 0 }, 0.09)
        .from("[data-hero-moon]", { scale: 0.86, duration: 1.4, ease: "expo.out" }, 0.05)
        .from("[data-hero-roof]", { yPercent: 40, duration: 0.9 }, 0.1)
        .from("[data-hero-warrior]", { yPercent: 12, opacity: 0, duration: 0.6, ease: "power3.out" }, 0.35)
        .from("[data-hero-far]", { yPercent: 30, duration: 1.2 }, 0.1)
        .fromTo(
          "[data-intro]",
          { clipPath: CLOSED },
          { clipPath: OPEN, duration: 0.55, stagger: 0.08, ease: "power3.inOut", clearProps: "clipPath" },
          0.45,
        );

      /* ---------- continuous: shards drift, scroll cue ---------- */
      gsap.utils.toArray<SVGElement>("[data-shard]").forEach((el, i) => {
        gsap.to(el, {
          y: gsap.utils.random(-26, 26),
          x: gsap.utils.random(-14, 14),
          rotation: `+=${gsap.utils.random(-60, 60)}`,
          duration: gsap.utils.random(2.6, 4.6),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.13,
        });
      });
      gsap.fromTo("[data-scroll-cue]", { yPercent: -110 }, { yPercent: 220, duration: 1.3, repeat: -1, ease: "power2.in" });
      gsap.to("[data-flame]", { scaleY: 1.08, transformOrigin: "50% 100%", duration: 0.18, repeat: -1, yoyo: true, ease: "steps(2)" });

      /* ---------- slash stage: pin hero, cut a diagonal across it ---------- */
      const stage = document.querySelector<HTMLElement>("[data-slash-stage]");
      const panel = document.querySelector<HTMLElement>("[data-slash-panel]");
      const blade = document.querySelector<HTMLElement>("[data-slash-blade]");
      const flash = document.querySelector<HTMLElement>("[data-slash-flash]");
      if (stage && panel && blade && flash) {
        const SLANT = 38; // % of width the cut leans over its height
        const cut = { p: 0 };
        let flashed = false;
        const render = () => {
          const a = cut.p * (100 + SLANT);
          const b = a - SLANT;
          panel.style.clipPath = `polygon(0% 0%, ${a}% 0%, ${b}% 100%, 0% 100%)`;
          const w = stage.clientWidth;
          const h = stage.clientHeight;
          const x0 = (a / 100) * w;
          const x1 = (b / 100) * w;
          const len = Math.hypot(x1 - x0, h);
          const ang = (Math.atan2(h, x1 - x0) * 180) / Math.PI;
          // extend the blade beyond both edges of the frame
          const ext = len * 0.15;
          const ux = (x1 - x0) / len;
          const uy = h / len;
          gsap.set(blade, {
            x: x0 - ux * ext,
            y: -uy * ext,
            width: len + ext * 2,
            rotation: ang,
            opacity: cut.p > 0.001 && cut.p < 0.999 ? 1 : 0,
          });
          if (cut.p > 0.97 && !flashed) {
            flashed = true;
            gsap.timeline().set(flash, { opacity: 1 }).set(flash, { opacity: 0 }, 0.08);
          } else if (cut.p < 0.5) {
            flashed = false;
          }
        };
        render();

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: "+=140%",
            pin: true,
            scrub: 0.35,
            anticipatePin: 1,
          },
        });
        tl.to("[data-hero-moon]", { yPercent: -14, ease: "none", duration: 1 }, 0)
          .to("[data-hero-far]", { yPercent: -6, ease: "none", duration: 1 }, 0)
          .to("[data-hero-title]", { yPercent: -18, ease: "none", duration: 1 }, 0)
          .to("[data-hero-warrior]", { xPercent: -4, ease: "none", duration: 1 }, 0)
          .to(cut, { p: 1, duration: 0.5, ease: "power2.in", onUpdate: render }, 0.38)
          .to("[data-hero-warrior]", { xPercent: -12, yPercent: 4, duration: 0.2, ease: "power4.out" }, 0.82)
          .fromTo("[data-panel-grove]", { yPercent: 6 }, { yPercent: 0, duration: 0.5, ease: "none" }, 0.5);
      }

      /* ---------- diagonal cut reveals ---------- */
      gsap.utils.toArray<HTMLElement>("[data-cut]").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: CLOSED },
          {
            clipPath: OPEN,
            duration: 0.6,
            ease: "power3.inOut",
            clearProps: "clipPath",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((list) => {
        gsap.fromTo(
          list.children,
          { clipPath: CLOSED, y: 30 },
          {
            clipPath: OPEN,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: "power3.inOut",
            scrollTrigger: { trigger: list, start: "top 82%", once: true },
            onComplete() {
              // let hard shadows breathe outside the clip once revealed
              gsap.set(list.children, { clearProps: "clipPath" });
            },
          },
        );
      });

      /* ---------- seam glints along diagonal section edges ---------- */
      gsap.utils.toArray<HTMLElement>("[data-glint]").forEach((el) => {
        const angle = Number(el.dataset.angle ?? 0);
        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 75%", once: true } })
          .fromTo(el, { rotation: angle, scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.45, ease: "power4.in" })
          .to(el, { opacity: 0, duration: 0.01 }, "+=0.12");
      });

      /* ---------- parallax ---------- */
      gsap.utils.toArray<HTMLElement>("[data-depth]").forEach((el) => {
        const d = Number(el.dataset.depth ?? 0.2);
        gsap.fromTo(
          el,
          { y: 30 * d },
          {
            y: -40 * d,
            ease: "none",
            scrollTrigger: { trigger: el.closest("section") ?? el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
      gsap.utils.toArray<SVGElement>("[data-streak]").forEach((el) => {
        gsap.fromTo(
          el,
          { xPercent: -100 },
          {
            xPercent: 0,
            duration: 0.5,
            ease: "power4.out",
            scrollTrigger: { trigger: el.closest("section") ?? el, start: "top 60%", once: true },
          },
        );
      });

      ScrollTrigger.refresh();

      return () => {
        html.classList.remove("motion");
      };
    });
  });

  return <div className="flash-frame" aria-hidden="true" />;
}
