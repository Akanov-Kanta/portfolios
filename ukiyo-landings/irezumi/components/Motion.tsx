"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { flashFrame } from "@/lib/flash";

const WIPE_FROM = "polygon(-30% 0%, 0% 0%, -30% 100%, -30% 100%)";
const WIPE_TO = "polygon(-30% 0%, 130% 0%, 100% 100%, -30% 100%)";

/**
 * All scroll/intro choreography lives here. Under prefers-reduced-motion nothing runs and the
 * page is simply rendered in its final state.
 */
export default function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      root.classList.remove("intro");
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    let mm: gsap.MatchMedia | null = null;

    const ctx = gsap.context(() => {
      /* ── intro: ink curtain, slash, white flash frame, split ── */
      const curtain = document.querySelector<HTMLElement>(".curtain");
      if (curtain && root.classList.contains("intro")) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const angle = (Math.atan2(-0.48 * h, w) * 180) / Math.PI;
        const len = Math.hypot(w, 0.48 * h) * 1.2;
        const nx = Math.sin((-angle * Math.PI) / 180); // perpendicular to the cut
        const ny = Math.cos((-angle * Math.PI) / 180);
        gsap.set("[data-curtain='slash']", { left: "50%", top: "54%", width: len, xPercent: -50, yPercent: -50, rotation: angle, scaleX: 0, transformOrigin: "0% 50%" });
        const tl = gsap.timeline({
          defaults: { ease: "power4.inOut" },
          onComplete: () => {
            root.classList.remove("intro");
            gsap.set(curtain, { clearProps: "all" });
          },
        });
        tl.from("[data-curtain='seal'] span", { scale: 1.6, opacity: 0, duration: 0.45, ease: "power3.out" })
          .to("[data-curtain='slash']", { scaleX: 1, duration: 0.22, ease: "power4.in" }, 0.55)
          .add(() => flashFrame("var(--rice)"), 0.78)
          .set("[data-curtain='seal']", { opacity: 0 }, 0.78)
          .to("[data-curtain='a']", { x: -nx * h * 0.9, y: -ny * h * 0.9, duration: 0.95 }, 0.82)
          .to("[data-curtain='b']", { x: nx * h * 0.9, y: ny * h * 0.9, duration: 0.95 }, 0.82)
          .to("[data-curtain='slash']", { opacity: 0, duration: 0.2 }, 0.86)
          .from("[data-intro='art'] svg", { scale: 0.9, rotation: -4, duration: 1.3, ease: "expo.out" }, 0.86)
          .fromTo("[data-intro='title']", { clipPath: WIPE_FROM }, { clipPath: WIPE_TO, duration: 0.7, clearProps: "clipPath" }, 1.05)
          .from("[data-intro='line']", { x: -40, opacity: 0, duration: 0.5, ease: "power3.out" }, 1.1)
          .from("[data-intro='copy']", { y: 30, opacity: 0, duration: 0.6, ease: "power3.out" }, 1.25)
          .from("[data-intro='cta'] > *", { y: 24, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power3.out" }, 1.35)
          .from("[data-intro='side']", { yPercent: -30, opacity: 0, duration: 0.8, ease: "power3.out" }, 1.2);
      } else {
        root.classList.remove("intro");
      }

      const desktop = window.matchMedia("(min-width: 768px)").matches;

      /* ── slash-wipe reveals ── */
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        if (desktop && el.closest("[data-hscroll-track]")) return;
        const sibs = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.hasAttribute("data-reveal")) : [];
        const order = Math.max(0, sibs.indexOf(el));
        gsap.fromTo(
          el,
          { clipPath: WIPE_FROM },
          {
            clipPath: WIPE_TO,
            duration: 0.75,
            delay: (order % 3) * 0.09,
            ease: "power4.inOut",
            clearProps: "clipPath",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });

      /* ── layered parallax ── */
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const s = parseFloat(el.dataset.parallax || "0");
        const section = el.closest("section") ?? el;
        const isHero = section.id === "top";
        gsap.fromTo(
          el,
          { y: () => (isHero ? 0 : -s * window.innerHeight * 0.5) },
          {
            y: () => s * window.innerHeight * (isHero ? 1 : 0.5),
            ease: "none",
            scrollTrigger: { trigger: section, start: isHero ? "top top" : "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
          },
        );
      });

      /* ── process: pinned horizontal track + blade unsheathing (desktop) ── */
      mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const wrap = document.querySelector<HTMLElement>("[data-hscroll]");
        const track = document.querySelector<HTMLElement>("[data-hscroll-track]");
        if (!wrap || !track) return;
        wrap.classList.add("is-hscroll");
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const move = gsap.to(track, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: { trigger: wrap, start: "top top", end: () => `+=${dist() + window.innerHeight * 0.3}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
        });
        gsap.fromTo(
          "[data-blade]",
          { scaleX: 0.04, transformOrigin: "290px 50%" },
          { scaleX: 1, ease: "none", scrollTrigger: { trigger: wrap, start: "top top", end: () => `+=${dist()}`, scrub: 0.6, invalidateOnRefresh: true } },
        );
        track.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: WIPE_FROM },
            { clipPath: WIPE_TO, ease: "power4.inOut", duration: 0.7, clearProps: "clipPath", scrollTrigger: { trigger: el, containerAnimation: move, start: "left 92%" } },
          );
        });
        return () => wrap.classList.remove("is-hscroll");
      });
      mm.add("(max-width: 767px)", () => {
        gsap.fromTo(
          "[data-blade]",
          { scaleX: 0.04, transformOrigin: "290px 50%" },
          { scaleX: 1, ease: "none", scrollTrigger: { trigger: "#process", start: "top 70%", end: "bottom 60%", scrub: 0.6 } },
        );
      });
    });

    // fonts/images can shift layout after first paint
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      mm?.revert();
      ctx.revert();
    };
  }, []);

  return null;
}
