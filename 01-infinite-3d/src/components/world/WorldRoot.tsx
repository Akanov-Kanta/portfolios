"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { frame, worldStore, useWorld, type Tier } from "./state/world-store";
import { detectQuality } from "./quality";
import { routeStation, STATION_T } from "./path/stations";
import { flyTo } from "./path/routeFlight";
import { readLoopPref } from "./scroll/loop-pref";
import { WorldFallback } from "./fallback/WorldFallback";
import { WorldErrorBoundary } from "./WorldErrorBoundary";
import { isPhone } from "./phone";

const loadWorld = () => import("./WorldCanvas");
const WorldCanvas = dynamic(loadWorld, { ssr: false, loading: () => null });

export function WorldRoot() {
  const pathname = usePathname();
  const [mount, setMount] = useState(false);
  const tier = useWorld((s) => s.tier);
  const ready = useWorld((s) => s.webglReady);

  useEffect(() => {
    if (isPhone()) {
      // the phone profile is fixed for the session (a foldable unfolding keeps it until reload)
      worldStore.getState().set({ profile: "phone" });
      // parked until OrbStage's press-and-hold: no cursor on a phone to drive parallax, tilt or flee
      frame.pointerLive = false;
      // the gate (and the phone mount around it) is its own small chunk, so desktop first-load JS never carries it
      let alive = true;
      let cancel = () => {};
      import("./mount-gate")
        .then((m) => {
          if (alive) cancel = m.schedulePhoneWorld(() => setMount(true), loadWorld);
        })
        // offline with the chunk uncached: the page simply stays on its DOM stand-ins
        .catch(() => {});
      return () => {
        alive = false;
        cancel();
      };
    }
    const t: Tier = detectQuality();
    worldStore.getState().set({ tier: t });
    if (t === "static") return;
    // the loading screen is up until the world has settled (hud/IntroLoader.tsx): mount after the first paint
    const id = requestAnimationFrame(() => {
      worldStore.getState().set({ mounting: true });
      setMount(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const route = routeStation(pathname);
    worldStore.getState().set({ route, isHome: pathname === "/" });
    // on first load this runs before ScrollLoopProvider sets loopMode, so check the static inputs directly
    const still =
      worldStore.getState().loopMode === "static" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      readLoopPref() === "off" ||
      new URLSearchParams(location.search).get("loop") === "0";
    // a requested cut (phone jump / Back restore / a phone route change, PhoneHud) lands without the fly-through
    flyTo(STATION_T[route], still || performance.now() < frame.cutUntil ? 0 : 1.4);
  }, [pathname]);

  // phones: the host is 100lvh from the top, so a toolbar collapse never resizes the renderer
  return (
    <div className="pointer-events-none fixed inset-0 z-0 phone:bottom-auto phone:h-lvh" aria-hidden="true">
      <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: ready ? 0 : 1 }}>
        <WorldFallback />
      </div>
      {mount && tier !== "static" && (
        <WorldErrorBoundary>
          <WorldCanvas tier={tier} />
        </WorldErrorBoundary>
      )}
    </div>
  );
}
