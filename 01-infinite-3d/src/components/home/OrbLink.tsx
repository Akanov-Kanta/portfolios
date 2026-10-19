"use client";
import { useEffect, useRef } from "react";
import { orbScreen, useSocial } from "@/components/world/state/social-store";
import { frame, worldStore } from "@/components/world/state/world-store";
import { addTick } from "@/components/world/ticker";

/**
 * Desktop: the 3D orb logo (IconCloud) opens the selected platform. A transparent link is kept on the
 * logo's square every frame (ticker +10, after R3F wrote orbScreen). It is the stage's first child, so
 * the arrows and the label row stack above it. Shown only at the contact station, once the world is up
 * and the intro is over, and not while a transition dissolves the scene. Phones keep OrbStage's tap /
 * flick / hold on the orb slot and open links from the social grid.
 * A duplicate of the label link, so it is out of the tab order and hidden from assistive tech.
 */
export function OrbLink() {
  const ref = useRef<HTMLAnchorElement>(null);
  const href = useSocial((s) => s.href);
  const label = useSocial((s) => s.label);

  useEffect(() => {
    let shown = "";
    return addTick(() => {
      const a = ref.current;
      if (!a) return;
      const s = worldStore.getState();
      const on = orbScreen.on && s.webglReady && s.intro === "done" && s.station === "contact" && frame.transition < 0.4;
      let key = "off";
      let root: DOMRect | undefined;
      if (on) {
        // the canvas is the viewport on desktop; the stage is sticky, so place relative to it
        root = a.parentElement?.getBoundingClientRect();
        key = `${Math.round(orbScreen.x - (root?.left ?? 0))}|${Math.round(orbScreen.y - (root?.top ?? 0))}|${Math.round(orbScreen.half)}`;
      }
      if (key === shown) return;
      shown = key;
      if (!on) {
        a.style.visibility = "hidden";
        return;
      }
      const [x, y, h] = key.split("|").map(Number) as [number, number, number];
      a.style.visibility = "visible";
      a.style.width = a.style.height = `${h * 2}px`;
      a.style.transform = `translate(${x - h}px, ${y - h}px)`;
    }, 10);
  }, []);

  return (
    <a
      ref={ref}
      href={href || undefined}
      target="_blank"
      rel="noreferrer"
      tabIndex={-1}
      aria-hidden="true"
      data-cursor="open"
      data-cursor-text={label ? `OPEN ${label}` : "OPEN"}
      data-sfx="tick"
      className="absolute left-0 top-0 rounded-[22%] phone:hidden"
      style={{ visibility: "hidden" }}
    />
  );
}
