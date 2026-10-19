"use client";
import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { useWorld } from "@/components/world/state/world-store";

/** once dismissed, gone for the page lifetime (route changes remount the HUD) */
let gone = false;
const SCROLL_PX = 24;
/** the fade-out (phone-hud.css) before it unmounts */
const OUT_MS = 260;

/**
 * One-time cue '// Swipe up · it loops', 10 px above the Dock, with a breathing 16 px hairline
 * (static under reduced motion). Home only, at the hero, in touch-wrap (never in Still mode or under
 * reduced motion, which are static), before the first lap and while scrollY < 24. Hidden for good after
 * 24 px of scroll or once a lap completes. Portrait only (landscape has no hint).
 * The scroll is checked when the cue could first show and again a frame later, not only on scroll
 * events: arriving through /#station (a Dock tab on a project page, '← Back to projects') or a Back
 * restore scrolls before this listener exists (WebKit fires that scroll first).
 */
export function FirstRunHint() {
  const show = useWorld((s) => s.isHome && s.station === "hero" && s.loopMode === "touch-wrap" && s.laps === 0);
  const laps = useWorld((s) => s.laps);
  const [state, setState] = useState<"on" | "out" | "gone">(() => (gone ? "gone" : "on"));

  useEffect(() => {
    if (laps > 0) gone = true;
  }, [laps]);

  useEffect(() => {
    if (!show || state !== "on") return;
    const check = () => {
      if (window.scrollY < SCROLL_PX) return;
      gone = true;
      setState("out");
    };
    window.addEventListener("scroll", check, { passive: true });
    const raf = requestAnimationFrame(check);
    check();
    return () => {
      window.removeEventListener("scroll", check);
      cancelAnimationFrame(raf);
    };
  }, [show, state]);

  useEffect(() => {
    if (state !== "out") return;
    const timer = window.setTimeout(() => setState("gone"), OUT_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  if (!show || state === "gone") return null;
  // a visual gesture cue: screen readers move through the page their own way (and it would sit outside any landmark)
  return (
    <p data-first-run-hint="" data-out={state === "out" ? "" : undefined} aria-hidden="true" className="ph-hint label">
      <span className="ph-hint-line" />
      <span>
        {"// "}
        {site.phone.hint} <span className="marker-muted">· {site.phone.hintLoop}</span>
      </span>
    </p>
  );
}
