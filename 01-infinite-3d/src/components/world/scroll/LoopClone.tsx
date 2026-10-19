"use client";
import { useWorld } from "../state/world-store";
import { HeroVisual } from "@/components/home/Hero";

/**
 * Client-only visual copy of the hero, appended as the last child of #loop-root.
 * Pixel-identical to the real hero so the wrap (bottom → top) is invisible.
 * aria-hidden + inert: assistive tech and Tab never see it.
 */
export function LoopClone() {
  const mode = useWorld((s) => s.loopMode);
  if (mode !== "loop" && mode !== "touch-wrap") return null;
  return (
    <section data-station="hero-clone" aria-hidden="true" inert className="station h-lvh">
      <HeroVisual asClone />
    </section>
  );
}
