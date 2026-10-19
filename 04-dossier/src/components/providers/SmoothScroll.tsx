"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/motion";

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or null (SSR, first paint, or reduced motion = native scroll). */
export const useLenis = () => useContext(LenisContext);

/**
 * One smooth-scroll driver for the whole page: Lenis stepped by gsap.ticker (so GSAP and Lenis share a
 * frame), ScrollTrigger updated on every Lenis scroll. Reduced motion: no Lenis, native scrolling.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (reduced) return;
    const instance = new Lenis({ lerp: 0.09, smoothWheel: true, autoRaf: false });
    const onScroll = () => ScrollTrigger.update();
    instance.on("scroll", onScroll);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // publishing the instance to context is the point of this effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      instance.off("scroll", onScroll);
      instance.destroy();
      setLenis(null);
    };
  }, [reduced]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
