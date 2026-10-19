"use client";
import { useEffect } from "react";
import { frame, worldStore } from "../state/world-store";
import { lenisRef } from "./lenis-ref";
import { mapScroll } from "./anchors";
import { EASE, autoCenterSeconds, bezier } from "../theme";

/** igloo inOut1: the settle glide shares the caption / camera easing */
const glideEase = bezier(EASE.inOut);

/**
 * igloo never lets you rest mid-transition. 900 ms after scrolling stops:
 * finish or undo a half-done station transfer, and near the end of the lap
 * complete the wrap so you land on the real hero, not the clone.
 * The glide lasts 0.9–1.8 s by distance (theme.autoCenterSeconds) on EASE.inOut.
 */
export function useAutoCenter() {
  useEffect(() => {
    let timer = 0;
    const settle = () => {
      const lenis = lenisRef.current;
      const m = frame.mapping;
      if (!lenis || !m || worldStore.getState().loopMode !== "loop") return;
      if (document.activeElement?.closest("input,textarea,[role=dialog]")) return;
      const y = frame.scrollY;
      const glide = (target: number) =>
        lenis.scrollTo(target, { duration: autoCenterSeconds(target - y, window.innerHeight), easing: glideEase });
      if (y > m.limit * 0.97) {
        glide(m.limit);
        return;
      }
      const seg = m.segments.find((s) => y >= s.start && y < s.end);
      if (!seg) return;
      const { local } = mapScroll(y, m);
      if (y < seg.holdEnd) {
        // inside a hold zone: sections with several stops (projects) centre on the nearest device
        if (seg.stops > 1) {
          const i = Math.max(0, Math.min(seg.stops - 1, Math.round((y - seg.start) / m.vh)));
          const target = Math.min(seg.holdEnd, seg.start + i * m.vh);
          if (Math.abs(target - y) > 4) glide(target);
        }
        return;
      }
      if (local > 0.03 && local < 0.97) {
        glide(local < 0.5 ? seg.holdEnd : seg.end);
      }
    };
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 900);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
}
