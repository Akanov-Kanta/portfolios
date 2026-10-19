"use client";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { frame, worldStore, type LoopMode } from "../state/world-store";
import { observeAnchors } from "./anchors";
import { installTouchWrap } from "./touch-wrap";
import { lenisRef } from "./lenis-ref";
import { useLoopPref } from "./loop-pref";
import { addTick } from "../ticker";
import { installDriver } from "./driver";
import { stableVh } from "../phone";
import { CATCH_DWELL_MS, CATCH_MAX_MS, CATCH_SETTLE_PX, crossedStop, projectStops } from "./project-catch";

const TOUCH_SYNC = process.env.NEXT_PUBLIC_LOOP_TOUCH === "sync";
/** html[data-wrapped] after a phone touch-wrap: ScrambleOnView holds its replays this long */
const WRAPPED_MS = 1200;

const REDUCED = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  // read synchronously on the client so the first effect run already picks "static"
  // (no throwaway Lenis / LoopClone for reduced-motion users); never rendered, so no hydration mismatch
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia(REDUCED).matches);
  useEffect(() => {
    const mq = window.matchMedia(REDUCED);
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Decides the loop mode for the route, owns Lenis / native scroll, and writes `frame` every tick. */
export function ScrollLoopProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const reduced = useReducedMotion();
  const didInit = useRef(false);
  // re-run when the user flips the Loop toggle
  const loopPref = useLoopPref();

  useEffect(() => {
    // Never let the browser restore the previous scroll position: the loop must always open
    // at the hero. (Otherwise reloading while scrolled to the footer reopens at the footer.)
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (!didInit.current) {
      didInit.current = true;
      window.scrollTo(0, 0);
    }
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const params = new URLSearchParams(location.search);
    const off = loopPref === "off" || params.get("loop") === "0";
    frame.freeze = params.get("freeze") === "1";
    const mode: LoopMode = reduced || off ? "static" : !isHome ? "finite" : coarse && !TOUCH_SYNC ? "touch-wrap" : "loop";
    worldStore.getState().set({ isHome, loopMode: mode });
    document.documentElement.dataset.loop = mode;

    // phones map scroll on the stable 100svh and ignore height-only (toolbar) resizes, so the camera
    // never jumps when the browser bars move (WorldRoot wrote the profile before this effect runs)
    const phone = worldStore.getState().profile === "phone";
    const root = document.getElementById("loop-root");
    const offAnchors = isHome && root ? observeAnchors(root, phone ? { vh: stableVh, widthOnly: true } : undefined) : () => {};
    if (!isHome) frame.mapping = null;
    const offDriver = installDriver();

    // Native scroll: touch-wrap, static, and finite on touch
    if (mode === "static" || mode === "touch-wrap" || (mode === "finite" && coarse)) {
      // Phones read scrollY and the page height in scroll / resize events, before the frame's scroll-driven
      // caption animations are re-sampled: a read in the tick flushed those in a second style recalc every
      // scrolling frame (P6). The first layout read of a frame still pays for any running time-based CSS
      // animation or transition, wherever it happens, so none runs while a phone page scrolls (dock-motion.ts
      // eases the Dock's recede itself and holds the Email shimmer). Other devices read in the tick, as they
      // always have.
      let y = 0;
      let last = window.scrollY;
      let limit = 1;
      const measure = () => {
        y = window.scrollY;
        limit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      };
      if (phone) {
        measure();
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, { passive: true });
      }
      const offTick = addTick(() => {
        if (!phone) measure();
        frame.velocityPx = y - last;
        last = y;
        frame.scrollY = y;
        frame.limit = limit;
      }, -10);
      const html = document.documentElement;
      let wrappedTimer = 0;
      const offWrap =
        mode === "touch-wrap"
          ? installTouchWrap(() => {
              last = y = 0;
              worldStore.getState().set({ laps: worldStore.getState().laps + 1 });
              if (!phone) return;
              // the hero's scramble must not replay on the frame that replaced the identical clone
              html.dataset.wrapped = "";
              window.clearTimeout(wrappedTimer);
              wrappedTimer = window.setTimeout(() => delete html.dataset.wrapped, WRAPPED_MS);
            })
          : () => {};
      return () => {
        offTick();
        window.removeEventListener("resize", measure);
        window.removeEventListener("scroll", measure);
        offWrap();
        offAnchors();
        offDriver();
        window.clearTimeout(wrappedTimer);
        delete html.dataset.wrapped;
      };
    }

    // Lenis: infinite on the desktop home, plain smooth wheel on inner pages
    // project catch (project-catch.ts): while one is held, wheel input is swallowed
    let catchAt = 0;
    let settledAt = 0;
    const lenis = new Lenis({
      infinite: mode === "loop",
      syncTouch: mode === "loop" && coarse,
      lerp: 0.075,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.2,
      autoRaf: false,
      anchors: false,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
      // igloo-style runaway guard: the target never runs more than 0.6 viewport ahead of the rendered scroll
      virtualScroll: (d) => {
        const wheel = mode === "loop" && d.event.type.includes("wheel");
        if (wheel && catchAt) {
          const now = performance.now();
          if (now - catchAt < CATCH_MAX_MS && (!settledAt || now - settledAt < CATCH_DWELL_MS)) {
            if (d.event.cancelable) d.event.preventDefault(); // Lenis skips its own preventDefault on false
            return false;
          }
          catchAt = settledAt = 0;
        }
        const max = window.innerHeight * 0.6;
        const ahead = lenis.targetScroll - lenis.animatedScroll;
        d.deltaY = Math.max(-max - ahead, Math.min(max - ahead, d.deltaY));
        if (wheel) {
          const from = lenis.targetScroll;
          const stop = crossedStop(from, from + d.deltaY, projectStops(frame.mapping), lenis.limit);
          if (stop !== null) {
            d.deltaY = stop - from;
            catchAt = performance.now();
          }
        }
        return true;
      },
    });
    lenisRef.current = lenis;
    // desktop: locked under the loading screen, which starts it again as it lifts (hud/IntroLoader.tsx)
    if (!phone && !worldStore.getState().revealed) lenis.stop();
    (window as Window & { __lenis?: Lenis }).__lenis = lenis; // test hook (scripts/loop-probe.mjs)
    const offTick = addTick((time) => lenis.raf(time), -10);
    let prev = lenis.scroll;
    const offScroll = lenis.on("scroll", (l: Lenis) => {
      if (catchAt && !settledAt && Math.abs(l.targetScroll - l.animatedScroll) < CATCH_SETTLE_PX) settledAt = performance.now();
      // a backwards jump of more than half the page is the wrap
      if (mode === "loop" && prev - l.scroll > l.limit * 0.5) {
        worldStore.getState().set({ laps: worldStore.getState().laps + 1 });
      }
      prev = l.scroll;
      frame.scrollY = l.scroll;
      frame.limit = l.limit;
      frame.velocityPx = l.velocity;
    });
    frame.scrollY = lenis.scroll;
    frame.limit = lenis.limit;
    return () => {
      offScroll();
      offTick();
      offAnchors();
      offDriver();
      lenis.destroy();
      lenisRef.current = null;
      delete (window as Window & { __lenis?: Lenis }).__lenis;
      delete document.documentElement.dataset.loop;
    };
  }, [isHome, reduced, loopPref]);

  return <>{children}</>;
}
